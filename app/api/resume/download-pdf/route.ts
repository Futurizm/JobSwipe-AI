import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import puppeteer from "puppeteer"

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

interface ResumeData {
  fullName: string
  email: string
  phone: string
  location: string
  summary: string
  skills: string[]
  experience: {
    title: string
    company: string
    location: string
    startDate: string
    endDate: string
    description: string
  }[]
  education: {
    institution: string
    degree: string
    field: string
    graduationDate: string
  }[]
  languages: string[]
  certifications: string[]
  projects: {
    name: string
    description: string
  }[]
}

export async function POST(request: NextRequest) {
  let browser

  try {
    const { userInput } = await request.json()

    if (!userInput || userInput.trim().length < 10) {
      return NextResponse.json({ error: "Недостаточно информации для создания резюме" }, { status: 400 })
    }

    console.log("Parsing user input for PDF...")

    // Parse user input with AI
    const resumeData = await parseUserInputWithAI(userInput)

    console.log("Generating HTML for PDF...")

    // Generate HTML template for PDF (without buttons and scripts)
    const htmlContent = generateResumeHTML(resumeData, true)

    console.log("Launching browser...")

    // Launch headless browser with better configuration
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    })

    const page = await browser.newPage()

    // Set viewport and user agent
    await page.setViewport({ width: 1200, height: 1600 })
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

    console.log("Setting HTML content...")

    // Set HTML content with better wait conditions
    await page.setContent(htmlContent, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 30000,
    })

    // Wait a bit more for fonts to load
    await page.waitForTimeout(1000)

    console.log("Generating PDF...")

    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "10mm",
        right: "10mm",
      },
      displayHeaderFooter: false,
    })

    console.log("PDF generated successfully, size:", pdfBuffer.length)

    // Create safe filename
    const safeName = resumeData.fullName
      .replace(/[^a-zA-Z0-9а-яёА-ЯЁ\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50)

    const filename = `${safeName}_resume.pdf`

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": pdfBuffer.length.toString(),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error in download-pdf route:", error)

    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Detailed error:", errorMessage)

    return NextResponse.json(
      {
        error: "Не удалось создать PDF",
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  } finally {
    // Always close browser
    if (browser) {
      try {
        await browser.close()
        console.log("Browser closed successfully")
      } catch (closeError) {
        console.error("Error closing browser:", closeError)
      }
    }
  }
}

// Parse user input with AI and structure it
async function parseUserInputWithAI(userInput: string): Promise<ResumeData> {
  try {
    console.log("Using Gemini AI to parse resume data...")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      Проанализируй этот текст и создай полное резюме. Если какая-то информация не указана, придумай её сам, чтобы резюме было полным и профессиональным. Верни ТОЛЬКО валидный JSON без дополнительного текста.
      
      Требуемая структура JSON:
      {
        "fullName": "Полное имя",
        "email": "email@example.com",
        "phone": "+7 777 123 45 67",
        "location": "Город, Страна",
        "summary": "Краткое профессиональное резюме (2-3 предложения)",
        "skills": ["навык1", "навык2", "навык3", "навык4", "навык5", "навык6", "навык7", "навык8"],
        "experience": [
          {
            "title": "Должность",
            "company": "Компания",
            "location": "Город",
            "startDate": "Месяц Год",
            "endDate": "Месяц Год или Настоящее время",
            "description": "Описание обязанностей и достижений"
          }
        ],
        "education": [
          {
            "institution": "Учебное заведение",
            "degree": "Степень",
            "field": "Специальность",
            "graduationDate": "Год"
          }
        ],
        "languages": ["Русский (родной)", "Английский (средний)"],
        "certifications": ["Сертификат 1", "Сертификат 2"],
        "projects": [
          {
            "name": "Название проекта",
            "description": "Описание проекта"
          }
        ]
      }
      
      Текст пользователя: ${userInput}
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    let jsonText = response.text().trim()

    // Clean the response
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "")
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "")
    }

    const resumeData: ResumeData = JSON.parse(jsonText)

    // Ensure all required fields are present with fallbacks
    return {
      fullName: resumeData.fullName || "Иван Петров",
      email: resumeData.email || "ivan.petrov@example.com",
      phone: resumeData.phone || "+7 777 123 45 67",
      location: resumeData.location || "Алматы, Казахстан",
      summary: resumeData.summary || "Опытный специалист с навыками в различных областях.",
      skills:
        resumeData.skills?.length > 0 ? resumeData.skills : ["Коммуникация", "Работа в команде", "Решение проблем"],
      experience:
        resumeData.experience?.length > 0
          ? resumeData.experience
          : [
              {
                title: "Специалист",
                company: "ООО «ТехноПрогресс»",
                location: "Алматы",
                startDate: "Январь 2020",
                endDate: "Настоящее время",
                description: "Выполнение профессиональных обязанностей, работа с клиентами, решение задач.",
              },
            ],
      education:
        resumeData.education?.length > 0
          ? resumeData.education
          : [
              {
                institution: "Казахский Национальный Университет",
                degree: "Бакалавр",
                field: "Информационные технологии",
                graduationDate: "2018",
              },
            ],
      languages: resumeData.languages?.length > 0 ? resumeData.languages : ["Русский (родной)", "Английский (базовый)"],
      certifications:
        resumeData.certifications?.length > 0 ? resumeData.certifications : ["Профессиональный сертификат"],
      projects:
        resumeData.projects?.length > 0
          ? resumeData.projects
          : [
              {
                name: "Корпоративный проект",
                description: "Разработка и внедрение решений для бизнеса.",
              },
            ],
    }
  } catch (error) {
    console.error("Error with AI parsing:", error)

    // Return fallback data
    return {
      fullName: "Иван Петров",
      email: "ivan.petrov@example.com",
      phone: "+7 777 123 45 67",
      location: "Алматы, Казахстан",
      summary: "Опытный специалист с навыками в различных областях.",
      skills: ["Коммуникация", "Работа в команде", "Решение проблем"],
      experience: [
        {
          title: "Специалист",
          company: "ООО «ТехноПрогресс»",
          location: "Алматы",
          startDate: "Январь 2020",
          endDate: "Настоящее время",
          description: "Выполнение профессиональных обязанностей, работа с клиентами, решение задач.",
        },
      ],
      education: [
        {
          institution: "Казахский Национальный Университет",
          degree: "Бакалавр",
          field: "Информационные технологии",
          graduationDate: "2018",
        },
      ],
      languages: ["Русский (родной)", "Английский (базовый)"],
      certifications: ["Профессиональный сертификат"],
      projects: [
        {
          name: "Корпоративный проект",
          description: "Разработка и внедрение решений для бизнеса.",
        },
      ],
    }
  }
}

// Generate HTML template for PDF (simplified version without interactive elements)
function generateResumeHTML(data: ResumeData, forPDF = false): string {
  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.fullName} - Резюме</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #2d3748;
          background: white;
          font-size: 12px;
        }
        
        .container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #3182ce;
        }
        
        .name {
          font-size: 24px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 10px;
        }
        
        .contact-info {
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
          font-size: 11px;
          color: #4a5568;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #3182ce;
          margin-bottom: 15px;
          padding-bottom: 6px;
          border-bottom: 2px solid #e2e8f0;
          text-transform: uppercase;
        }
        
        .summary {
          font-size: 12px;
          line-height: 1.7;
          color: #4a5568;
          margin-bottom: 20px;
        }
        
        .skills-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          margin-bottom: 20px;
        }
        
        .skill-item {
          background: #667eea;
          color: white;
          padding: 6px 10px;
          border-radius: 4px;
          text-align: center;
          font-weight: 500;
          font-size: 10px;
        }
        
        .experience-item, .education-item, .project-item {
          margin-bottom: 15px;
          padding: 12px;
          background: #f7fafc;
          border-left: 3px solid #3182ce;
          border-radius: 0 4px 4px 0;
        }
        
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        
        .item-title {
          font-weight: 600;
          font-size: 14px;
          color: #1a202c;
        }
        
        .item-subtitle {
          font-size: 12px;
          color: #4a5568;
          margin-top: 2px;
        }
        
        .item-date {
          font-size: 10px;
          color: #718096;
          background: #e2e8f0;
          padding: 2px 8px;
          border-radius: 10px;
        }
        
        .item-description {
          font-size: 11px;
          line-height: 1.5;
          color: #4a5568;
          margin-top: 8px;
        }
        
        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .language-item, .cert-item {
          background: #48bb78;
          color: white;
          padding: 6px 10px;
          border-radius: 4px;
          margin-bottom: 4px;
          font-weight: 500;
          text-align: center;
          font-size: 10px;
        }
        
        .cert-item {
          background: #ed8936;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 9px;
          color: #a0aec0;
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
        }
        
        @media print {
          body { font-size: 10px; }
          .container { padding: 0; }
          .name { font-size: 20px; }
          .section-title { font-size: 14px; }
          .item-title { font-size: 12px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header class="header">
          <h1 class="name">${data.fullName}</h1>
          <div class="contact-info">
            ${data.email ? `<div>📧 ${data.email}</div>` : ""}
            ${data.phone ? `<div>📞 ${data.phone}</div>` : ""}
            ${data.location ? `<div>📍 ${data.location}</div>` : ""}
          </div>
        </header>
        
        ${
          data.summary
            ? `
        <section class="section">
          <h2 class="section-title">Профессиональное резюме</h2>
          <div class="summary">${data.summary}</div>
        </section>
        `
            : ""
        }
        
        ${
          data.skills?.length > 0
            ? `
        <section class="section">
          <h2 class="section-title">Ключевые навыки</h2>
          <div class="skills-container">
            ${data.skills.map((skill) => `<div class="skill-item">${skill}</div>`).join("")}
          </div>
        </section>
        `
            : ""
        }
        
        ${
          data.experience?.length > 0
            ? `
        <section class="section">
          <h2 class="section-title">Опыт работы</h2>
          ${data.experience
            .map(
              (exp) => `
            <div class="experience-item">
              <div class="item-header">
                <div>
                  <h3 class="item-title">${exp.title}</h3>
                  <p class="item-subtitle">${exp.company}${exp.location ? `, ${exp.location}` : ""}</p>
                </div>
                <span class="item-date">${exp.startDate} - ${exp.endDate}</span>
              </div>
              <div class="item-description">${exp.description}</div>
            </div>
          `,
            )
            .join("")}
        </section>
        `
            : ""
        }
        
        ${
          data.education?.length > 0
            ? `
        <section class="section">
          <h2 class="section-title">Образование</h2>
          ${data.education
            .map(
              (edu) => `
            <div class="education-item">
              <div class="item-header">
                <div>
                  <h3 class="item-title">${edu.institution}</h3>
                  <p class="item-subtitle">${edu.degree}, ${edu.field}</p>
                </div>
                <span class="item-date">${edu.graduationDate}</span>
              </div>
            </div>
          `,
            )
            .join("")}
        </section>
        `
            : ""
        }
        
        ${
          data.projects?.length > 0
            ? `
        <section class="section">
          <h2 class="section-title">Проекты</h2>
          ${data.projects
            .map(
              (project) => `
            <div class="project-item">
              <h3 class="item-title">${project.name}</h3>
              <div class="item-description">${project.description}</div>
            </div>
          `,
            )
            .join("")}
        </section>
        `
            : ""
        }
        
        <div class="two-column">
          ${
            data.languages?.length > 0
              ? `
          <section class="section">
            <h2 class="section-title">Языки</h2>
            ${data.languages.map((lang) => `<div class="language-item">${lang}</div>`).join("")}
          </section>
          `
              : ""
          }
          
          ${
            data.certifications?.length > 0
              ? `
          <section class="section">
            <h2 class="section-title">Сертификаты</h2>
            ${data.certifications.map((cert) => `<div class="cert-item">${cert}</div>`).join("")}
          </section>
          `
              : ""
          }
        </div>
        
        <footer class="footer">
          Резюме создано с помощью AI Resume Builder
        </footer>
      </div>
    </body>
    </html>
  `
}
