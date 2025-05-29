import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer from "puppeteer";

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "AIzaSyCLIB1yGy-lyyXbyWr5mebsmC46GCHx6Dk");

interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
  }[];
  languages: string[];
  certifications: string[];
  projects: {
    name: string;
    description: string;
  }[];
}

// Маршрут для предпросмотра резюме (возвращает HTML)
export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json();

    if (!userInput || userInput.trim().length < 10) {
      return NextResponse.json({ error: "Недостаточно информации для создания резюме" }, { status: 400 });
    }

    console.log("Parsing user input...");

    // Parse user input with AI
    const resumeData = await parseUserInputWithAI(userInput);

    console.log("Generating HTML...");

    // Generate HTML template for preview
    const htmlContent = generateResumeHTML(resumeData, userInput);

    console.log("HTML generated successfully");

    // Return HTML for preview
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in preview route:", error);
    return NextResponse.json(
      { error: "Не удалось создать резюме: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    );
  }
}

// Маршрут для скачивания PDF
export async function POST_PDF(request: NextRequest) {
  try {
    const { userInput } = await request.json();

    if (!userInput || userInput.trim().length < 10) {
      return NextResponse.json({ error: "Недостаточно информации для создания резюме" }, { status: 400 });
    }

    console.log("Parsing user input for PDF...");

    // Parse user input with AI
    const resumeData = await parseUserInputWithAI(userInput);

    console.log("Generating HTML for PDF...");

    // Generate HTML template for PDF
    const htmlContent = generateResumeHTML(resumeData, userInput);

    console.log("Generating PDF...");

    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set HTML content
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "10mm",
        right: "10mm",
      },
    });

    // Close browser
    await browser.close();

    console.log("PDF generated successfully");

    // Encode filename for Content-Disposition
    const encodedFilename = encodeURIComponent(resumeData.fullName.replace(/\s+/g, "_")) + "_resume.pdf";
    const safeFilename = resumeData.fullName.replace(/[^a-zA-Z0-9\s]/g, "_").replace(/\s+/g, "_") + "_resume.pdf";

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in generate-pdf route:", error);
    return NextResponse.json(
      { error: "Не удалось создать PDF: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    );
  }
}

// Parse user input with AI and structure it
export async function parseUserInputWithAI(userInput: string): Promise<ResumeData> {
  try {
    console.log("Using Gemini AI to parse resume data...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
          },
          {
            "title": "Предыдущая должность",
            "company": "Предыдущая компания",
            "location": "Город",
            "startDate": "Месяц Год",
            "endDate": "Месяц Год",
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
      
      Инструкции:
      - Если информация не указана, ОБЯЗАТЕЛЬНО придумай реалистичные данные, подходящие по контексту
      - Для summary создай профессиональное описание на основе опыта и навыков
      - Навыки извлекай из текста и добавляй релевантные для профессии (минимум 8 навыков)
      - Если опыт работы не указан подробно, создай минимум 2 места работы с реалистичными данными
      - Все тексты должны быть на русском языке
      - Даты в формате "Месяц Год"
      - Добавь минимум 1 проект с описанием
      - Добавь минимум 2 языка
      - Если не указаны сертификаты, придумай 1-2 релевантных сертификата
      
      Текст пользователя:
      ${userInput}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonText = response.text().trim();

    console.log("Received response from Gemini AI");

    // Clean the response
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
    }

    try {
      console.log("Parsing JSON response...");
      const resumeData: ResumeData = JSON.parse(jsonText);

      // Ensure all fields are present
      return {
        fullName: resumeData.fullName || "Иван Петров",
        email: resumeData.email || "ivan.petrov@example.com",
        phone: resumeData.phone || "+7 777 123 45 67",
        location: resumeData.location || "Алматы, Казахстан",
        summary: resumeData.summary || "Опытный специалист с навыками в различных областях.",
        skills:
          resumeData.skills?.length > 0
            ? resumeData.skills
            : [
                "Коммуникация",
                "Работа в команде",
                "Решение проблем",
                "Адаптивность",
                "Организованность",
                "Аналитическое мышление",
                "Управление временем",
                "Внимание к деталям",
              ],
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
                {
                  title: "Младший специалист",
                  company: "Стартап «Инновация»",
                  location: "Алматы",
                  startDate: "Март 2018",
                  endDate: "Декабрь 2019",
                  description: "Помощь в реализации проектов, обучение, развитие профессиональных навыков.",
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
        languages:
          resumeData.languages?.length > 0 ? resumeData.languages : ["Русский (родной)", "Английский (базовый)"],
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
      };
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      console.log("Invalid JSON:", jsonText);
      throw new Error("Не удалось обработать ответ ИИ");
    }
  } catch (error) {
    console.error("Error with AI parsing:", error);

    // Fallback: basic parsing with auto-generation
    console.log("Using fallback parsing with auto-generation...");

    const name = extractName(userInput) || "Иван Петров";
    const email = extractEmail(userInput) || "ivan.petrov@example.com";
    const phone = extractPhone(userInput) || "+7 777 123 45 67";
    const location = extractLocation(userInput) || "Алматы, Казахстан";
    const extractedSkills = extractSkills(userInput);

    const skills =
      extractedSkills.length > 0
        ? extractedSkills
        : [
            "Коммуникация",
            "Работа в команде",
            "Решение проблем",
            "Адаптивность",
            "Организованность",
            "Аналитическое мышление",
            "Управление временем",
            "Внимание к деталям",
          ];

    // Determine profession based on skills or input
    let profession = "Специалист";
    if (
      userInput.toLowerCase().includes("разработчик") ||
      userInput.toLowerCase().includes("программист") ||
      skills.some((s) => ["javascript", "python", "java", "react", "angular", "node"].includes(s.toLowerCase()))
    ) {
      profession = "Разработчик программного обеспечения";
    } else if (
      userInput.toLowerCase().includes("дизайнер") ||
      skills.some((s) => ["figma", "photoshop", "ui", "ux", "дизайн"].includes(s.toLowerCase()))
    ) {
      profession = "UX/UI Дизайнер";
    } else if (
      userInput.toLowerCase().includes("маркетолог") ||
      skills.some((s) => ["маркетинг", "smm", "реклама", "продвижение"].includes(s.toLowerCase()))
    ) {
      profession = "Маркетолог";
    }

    return {
      fullName: name,
      email: email,
      phone: phone,
      location: location,
      summary: `Опытный ${profession.toLowerCase()} с навыками в ${skills.slice(0, 3).join(", ")}. Стремлюсь к профессиональному росту и развитию в динамичной компании.`,
      skills: skills,
      experience: [
        {
          title: profession,
          company: "ООО «ТехноПрогресс»",
          location: location.split(",")[0],
          startDate: "Январь 2020",
          endDate: "Настоящее время",
          description: `Работа над проектами компании, взаимодействие с клиентами, ${skills.slice(0, 3).join(", ")}.`,
        },
        {
          title: `Младший ${profession.toLowerCase()}`,
          company: "Стартап «Инновация»",
          location: location.split(",")[0],
          startDate: "Март 2018",
          endDate: "Декабрь 2019",
          description: "Помощь в реализации проектов, обучение, развитие профессиональных навыков.",
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
      languages: ["Русский (родной)", "Английский (средний)", "Казахский (базовый)"],
      certifications: [`Сертификат ${profession}`, "Курс повышения квалификации"],
      projects: [
        {
          name: "Корпоративный проект",
          description: `Разработка и внедрение решений для бизнеса с использованием ${skills.slice(0, 3).join(", ")}.`,
        },
      ],
    };
  }
}

// Fallback extraction functions
function extractName(text: string): string | null {
  const namePatterns = [/(?:меня зовут|имя|name)\s+([А-ЯЁа-яё]+\s+[А-ЯЁа-яё]+)/i, /^([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)/];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractEmail(text: string): string | null {
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const match = text.match(emailPattern);
  return match ? match[1] : null;
}

function extractPhone(text: string): string | null {
  const phonePattern = /(\+?[0-9\s\-()]{10,})/;
  const match = text.match(phonePattern);
  return match ? match[1] : null;
}

function extractLocation(text: string): string | null {
  const cities = ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе", "Тараз", "Павлодар"];
  for (const city of cities) {
    if (text.toLowerCase().includes(city.toLowerCase())) {
      return `${city}, Казахстан`;
    }
  }
  return null;
}

function extractSkills(text: string): string[] {
  const skillPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|React|Angular|Vue|Node\.js|HTML|CSS)\b/gi,
    /\b(Photoshop|Figma|Adobe|Design|UX|UI)\b/gi,
    /\b(Word|Excel|PowerPoint|Office)\b/gi,
    /\b(Коммуникация|Лидерство|Управление|Организация|Аналитика)\b/gi,
  ];

  const skills = new Set<string>();
  skillPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((match) => skills.add(match));
    }
  });

  return Array.from(skills);
}

// Generate HTML template for the resume
export function generateResumeHTML(data: ResumeData, userInput: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.fullName} - Резюме</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', Arial, sans-serif;
          line-height: 1.6;
          color: #2d3748;
          background: white;
          font-size: 14px;
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
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }
        
        .contact-info {
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #4a5568;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #3182ce;
          margin-bottom: 15px;
          padding-bottom: 6px;
          border-bottom: 2px solid #e2e8f0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary {
          font-size: 14px;
          line-height: 1.7;
          color: #4a5568;
          text-align: justify;
          margin-bottom: 20px;
        }
        
        .skills-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .skill-item {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          text-align: center;
          font-weight: 500;
          font-size: 12px;
          box-shadow: 0 2px 3px rgba(0,0,0,0.1);
        }
        
        .experience-item, .education-item, .project-item {
          margin-bottom: 20px;
          padding: 15px;
          background: #f7fafc;
          border-left: 3px solid #3182ce;
          border-radius: 0 6px 6px 0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .item-title {
          font-weight: 600;
          font-size: 16px;
          color: #1a202c;
          margin: 0;
        }
        
        .item-subtitle {
          font-size: 14px;
          color: #4a5568;
          margin: 3px 0 0 0;
          font-weight: 500;
        }
        
        .item-date {
          font-size: 12px;
          color: #718096;
          font-weight: 500;
          background: #e2e8f0;
          padding: 3px 10px;
          border-radius: 15px;
          white-space: nowrap;
        }
        
        .item-description {
          font-size: 13px;
          line-height: 1.6;
          color: #4a5568;
          margin-top: 10px;
        }
        
        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 15px;
        }
        
        .language-item, .cert-item {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 6px;
          font-weight: 500;
          text-align: center;
          box-shadow: 0 2px 3px rgba(0,0,0,0.1);
        }
        
        .cert-item {
          background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 11px;
          color: #a0aec0;
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
        }
        
        .button-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 1000;
        }
        
        .preview-button, .download-button {
          background: #3182ce;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          font-size: 14px;
        }
        
        .preview-button:hover {
          background: #2c5282;
        }
        
        .download-button {
          background: #48bb78;
        }
        
        .download-button:hover {
          background: #38a169;
        }
        
        .preview-mode .container {
          width: 100%;
          max-width: 100%;
          padding: 10px;
          margin: 0;
        }
        
        .preview-mode body {
          font-size: 10px;
        }
        
        .preview-mode .name {
          font-size: 20px;
        }
        
        .preview-mode .contact-info {
          flex-direction: column;
          gap: 5px;
          font-size: 9px;
        }
        
        .preview-mode .section {
          margin-bottom: 15px;
        }
        
        .preview-mode .section-title {
          font-size: 14px;
          margin-bottom: 10px;
          padding-bottom: 4px;
        }
        
        .preview-mode .summary {
          font-size: 10px;
          margin-bottom: 10px;
        }
        
        .preview-mode .skills-container {
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 5px;
        }
        
        .preview-mode .skill-item {
          font-size: 9px;
          padding: 5px;
        }
        
        .preview-mode .experience-item, .preview-mode .education-item, .preview-mode .project-item {
          padding: 8px;
          margin-bottom: 10px;
        }
        
        .preview-mode .item-header {
          flex-direction: column;
          gap: 5px;
        }
        
        .preview-mode .item-title {
          font-size: 12px;
        }
        
        .preview-mode .item-subtitle, .preview-mode .item-description {
          font-size: 10px;
        }
        
        .preview-mode .item-date {
          font-size: 9px;
          padding: 2px 6px;
        }
        
        .preview-mode .two-column {
          grid-template-columns: 1fr;
          gap: 10px;
        }
        
        .preview-mode .language-item, .preview-mode .cert-item {
          font-size: 9px;
          padding: 5px;
        }
        
        .preview-mode .footer {
          font-size: 8px;
          margin-top: 15px;
          padding-top: 10px;
        }
        
        /* Стили для печати (используются Puppeteer) */
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body {
            font-size: 10px;
            width: 100%;
            margin: 0;
          }
          
          .container {
            width: 100%;
            max-width: 100%;
            padding: 0;
            margin: 0;
          }
          
          .header {
            margin-bottom: 15px;
            padding-bottom: 10px;
          }
          
          .name {
            font-size: 20px;
          }
          
          .contact-info {
            flex-direction: column;
            gap: 5px;
            font-size: 9px;
          }
          
          .section {
            margin-bottom: 15px;
          }
          
          .section-title {
            font-size: 14px;
            margin-bottom: 10px;
            padding-bottom: 4px;
          }
          
          .summary {
            font-size: 10px;
            margin-bottom: 10px;
          }
          
          .skills-container {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 5px;
          }
          
          .skill-item {
            font-size: 9px;
            padding: 5px;
            background: #4a5568 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .experience-item, .education-item, .project-item {
            padding: 8px;
            margin-bottom: 10px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          .item-header {
            flex-direction: column;
            gap: 5px;
          }
          
          .item-title {
            font-size: 12px;
          }
          
          .item-subtitle, .item-description {
            font-size: 10px;
          }
          
          .item-date {
            font-size: 9px;
            padding: 2px 6px;
          }
          
          .two-column {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          
          .language-item, .cert-item {
            font-size: 9px;
            padding: 5px;
            background: #4a5568 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .footer {
            font-size: 8px;
            margin-top: 15px;
            padding-top: 10px;
          }
          
          .button-container {
            display: none;
          }
        }
        
        /* Адаптивные стили для экрана */
        @media (max-width: 768px) {
          .container {
            padding: 15px;
          }
          
          .name {
            font-size: 24px;
          }
          
          .contact-info {
            flex-direction: column;
            gap: 8px;
            font-size: 12px;
          }
          
          .section-title {
            font-size: 16px;
          }
          
          .skills-container {
            grid-template-columns: 1fr;
          }
          
          .skill-item {
            font-size: 12px;
            padding: 8px;
          }
          
          .experience-item, .education-item, .project-item {
            padding: 10px;
          }
          
          .item-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .item-title {
            font-size: 14px;
          }
          
          .item-subtitle, .item-description {
            font-size: 12px;
          }
          
          .item-date {
            font-size: 11px;
            padding: 2px 8px;
          }
          
          .two-column {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .language-item, .cert-item {
            font-size: 12px;
            padding: 8px;
          }
          
          .button-container {
            bottom: 10px;
            right: 10px;
          }
          
          .preview-button, .download-button {
            padding: 8px 16px;
            font-size: 12px;
          }
        }
        
        @media (max-width: 480px) {
          .container {
            padding: 10px;
          }
          
          .name {
            font-size: 20px;
          }
          
          .section-title {
            font-size: 14px;
          }
          
          .summary {
            font-size: 12px;
          }
          
          .skills-container {
            gap: 8px;
          }
          
          .skill-item {
            font-size: 11px;
            padding: 6px;
          }
          
          .experience-item, .education-item, .project-item {
            padding: 8px;
          }
          
          .item-title {
            font-size: 13px;
          }
          
          .item-subtitle, .item-description {
            font-size: 11px;
          }
          
          .item-date {
            font-size: 10px;
          }
          
          .language-item, .cert-item {
            font-size: 11px;
            padding: 6px;
          }
          
          .button-container {
            width: 90%;
            left: 50%;
            transform: translateX(-50%);
            bottom: 15px;
            right: unset;
          }
          
          .preview-button, .download-button {
            width: 100%;
            padding: 10px;
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header class="header">
          <h1 class="name">${data.fullName}</h1>
          <div class="contact-info">
            ${data.email ? `<div class="contact-item">Email: ${data.email}</div>` : ""}
            ${data.phone ? `<div class="contact-item">Телефон: ${data.phone}</div>` : ""}
            ${data.location ? `<div class="contact-item">Местоположение: ${data.location}</div>` : ""}
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
          data.skills && data.skills.length > 0
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
          data.experience && data.experience.length > 0
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
          data.education && data.education.length > 0
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
          data.projects && data.projects.length > 0
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
            data.languages && data.languages.length > 0
              ? `
          <section class="section">
            <h2 class="section-title">Языки</h2>
            ${data.languages.map((lang) => `<div class="language-item">${lang}</div>`).join("")}
          </section>
          `
              : ""
          }
          
          ${
            data.certifications && data.certifications.length > 0
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
      
      <div class="button-container">
        <button class="preview-button" onclick="document.body.classList.toggle('preview-mode')">Предпросмотр</button>
        <button class="download-button" onclick="downloadPDF()">Скачать PDF</button>
      </div>
      
      <script>
        async function downloadPDF() {
          try {
            const response = await fetch('/api/resume/download-pdf', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userInput: ${JSON.stringify(userInput)} }),
            });
            
            if (!response.ok) {
              throw new Error('Ошибка при скачивании PDF');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '${data.fullName.replace(/\s+/g, "_")}_resume.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          } catch (error) {
            alert('Не удалось скачать PDF: ' + error.message);
          }
        }
      </script>
    </body>
    </html>
  `;
}