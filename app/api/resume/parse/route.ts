import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GOOGLE_API_KEY } from "@/constants/constants"

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY) 

// Function to extract text from PDF using browser APIs
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Use PDF.js library for better PDF parsing
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Convert to base64 for processing
    const base64 = Buffer.from(uint8Array).toString("base64")

    // Use Gemini to extract text from PDF
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      Extract all text content from this PDF resume. Return ONLY the raw text content without any formatting or additional commentary.
      Focus on extracting:
      - Personal information (name, email, phone, location)
      - Work experience details
      - Education information
      - Skills and technologies
      - Any other relevant resume content
      
      Return the extracted text as plain text.
    `

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      },
    ])

    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    throw new Error("Failed to extract text from PDF")
  }
}

// Enhanced skill extraction with better patterns
function extractSkillsWithRegex(text: string): string[] {
  const skillsPatterns = [
    // Programming languages
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|PHP|Swift|Kotlin|Go|Rust|Scala|Perl|R|MATLAB|Objective-C)\b/gi,
    // Frontend frameworks and libraries
    /\b(React|Angular|Vue\.js|Svelte|Next\.js|Nuxt\.js|Gatsby|Ember\.js|Backbone\.js|jQuery)\b/gi,
    // Backend frameworks
    /\b(Node\.js|Express|Django|Flask|Spring|Laravel|ASP\.NET|Ruby on Rails|FastAPI|Koa)\b/gi,
    // Databases
    /\b(MySQL|PostgreSQL|MongoDB|Redis|Cassandra|DynamoDB|SQLite|Oracle|SQL Server|Firebase)\b/gi,
    // Cloud and DevOps
    /\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|GitLab CI|GitHub Actions|Terraform|Ansible)\b/gi,
    // Tools and technologies
    /\b(Git|SVN|Webpack|Vite|Babel|ESLint|Prettier|Jest|Cypress|Selenium|Postman)\b/gi,
    // Design and UI
    /\b(Figma|Adobe XD|Sketch|Photoshop|Illustrator|InVision|Zeplin|Principle)\b/gi,
    // Mobile development
    /\b(React Native|Flutter|Xamarin|Ionic|Cordova|Swift|Kotlin|Android|iOS)\b/gi,
    // Data and AI
    /\b(TensorFlow|PyTorch|Pandas|NumPy|Scikit-learn|Jupyter|Tableau|Power BI)\b/gi,
    // Web technologies
    /\b(HTML5?|CSS3?|SASS|SCSS|LESS|Bootstrap|Tailwind|Material-UI|Chakra UI)\b/gi,
    // Teaching and education
    /\b(Педагогика|Teaching|Education|Curriculum|Lesson Planning|Classroom Management|Assessment)\b/gi,
    // Cooking and culinary
    /\b(Кулинария|Cooking|Culinary|Baking|Food Safety|Menu Planning|Kitchen Management)\b/gi,
    // Medical and healthcare
    /\b(Медицина|Medicine|Healthcare|Nursing|Patient Care|Medical Records|Diagnosis)\b/gi,
    // Business and management
    /\b(Management|Leadership|Project Management|Business Analysis|Strategic Planning|Team Building)\b/gi,
    // Sales and marketing
    /\b(Sales|Marketing|Customer Service|CRM|Lead Generation|Social Media|Content Marketing)\b/gi,
    // Finance and accounting
    /\b(Accounting|Finance|Bookkeeping|Tax Preparation|Financial Analysis|Budgeting)\b/gi,
  ]

  const skills = new Set<string>()

  // Extract using patterns
  skillsPatterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach((match) => skills.add(match.trim()))
    }
  })

  // Extract from skills sections
  const skillSectionRegex =
    /(?:навыки|skills|умения|технологии|technologies|компетенции|expertise)[:：\s]*([^.]*?)(?:\n|$)/gi
  const skillSections = [...text.matchAll(skillSectionRegex)]

  skillSections.forEach((match) => {
    const skillText = match[1]
    if (skillText) {
      const individualSkills = skillText
        .split(/[,;•\n\r]/)
        .map((s) => s.trim())
        .filter((s) => s && s.length > 1 && s.length < 50)

      individualSkills.forEach((skill) => skills.add(skill))
    }
  })

  return Array.from(skills).slice(0, 20) // Limit to 20 skills
}

// Extract location information
function extractLocation(text: string): string {
  const locationPatterns = [
    /(?:город|city|location|адрес|address)[:：\s]*([^,\n]*)/gi,
    /\b(Алматы|Астана|Нур-Султан|Шымкент|Караганда|Акто��е|Тараз|Павлодар|Усть-Каменогорск|Семей|Атырау|Костанай|Кызылорда|Уральск|Петропавловск|Темиртау|Туркестан|Актау|Кокшетау|Талдыкорган)\b/gi,
    /\b(Almaty|Astana|Nur-Sultan|Shymkent|Karaganda|Aktobe|Taraz|Pavlodar|Ust-Kamenogorsk|Semey|Atyrau|Kostanay|Kyzylorda|Uralsk|Petropavlovsk|Temirtau|Turkestan|Aktau|Kokshetau|Taldykorgan)\b/gi,
  ]

  for (const pattern of locationPatterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      return matches[0].replace(/^(город|city|location|адрес|address)[:：\s]*/i, "").trim()
    }
  }

  return ""
}

// Extract experience information
function extractExperience(text: string): string {
  const experiencePatterns = [
    /(?:опыт работы|experience|стаж)[:：\s]*([^.\n]*)/gi,
    /(\d+)\s*(?:лет|года?|years?|год)\s*(?:опыта|experience)/gi,
    /(?:работал|worked|experience).*?(\d+)\s*(?:лет|года?|years?|год)/gi,
  ]

  for (const pattern of experiencePatterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      return matches[0].trim()
    }
  }

  return ""
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file type
    const fileType = file.type
    if (
      ![
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ].includes(fileType)
    ) {
      return NextResponse.json(
        {
          error: "Unsupported file type. Please upload PDF, DOCX, or TXT file",
        },
        { status: 400 },
      )
    }

    let resumeText = ""

    // Extract text based on file type
    if (fileType === "application/pdf") {
      resumeText = await extractTextFromPDF(file)
    } else {
      // For other file types, read as text
      const fileBuffer = await file.arrayBuffer()
      resumeText = new TextDecoder().decode(fileBuffer)
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Could not extract meaningful text from the file" }, { status: 400 })
    }

    // Extract basic information using regex
    const skills = extractSkillsWithRegex(resumeText)
    const location = extractLocation(resumeText)
    const experience = extractExperience(resumeText)

    // Initialize default resumeData
    let resumeData = {
      name: "",
      email: "",
      phone: "",
      location: location,
      skills: skills,
      experience: experience,
      experienceYears: 0,
      education: [],
      summary: "",
    }

    try {
      // Use Gemini for structured extraction
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `
        Analyze this resume text and extract structured information. Return ONLY a valid JSON object with no additional text.
        
        Required JSON structure:
        {
          "name": "Full name of the person",
          "email": "Email address",
          "phone": "Phone number",
          "location": "City or location (prefer Kazakhstan cities)",
          "skills": ["Array", "of", "technical", "skills"],
          "experience": "Experience description",
          "experienceYears": 0,
          "education": [
            {
              "institution": "University/School name",
              "degree": "Degree or certificate",
              "year": "Year or period"
            }
          ],
          "summary": "Brief professional summary"
        }
        
        Special instructions:
        - For experienceYears, extract the number of years of experience (0 if not found)
        - Focus on technical skills for the skills array
        - If location mentions Kazakhstan cities, use the Kazakh city name
        - Keep skills relevant to IT/tech if this is a tech resume
        
        Resume text:
        ${resumeText.substring(0, 8000)}
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      let parsedResume = response.text()

      // Clean the response
      parsedResume = parsedResume.trim()
      if (parsedResume.startsWith("```json")) {
        parsedResume = parsedResume.replace(/```json\n?/, "").replace(/\n?```$/, "")
      } else if (parsedResume.startsWith("```")) {
        parsedResume = parsedResume.replace(/```\n?/, "").replace(/\n?```$/, "")
      }

      const aiResumeData = JSON.parse(parsedResume)

      // Merge AI data with regex-extracted data
      resumeData = {
        ...aiResumeData,
        skills: [...new Set([...(aiResumeData.skills || []), ...skills])],
        location: aiResumeData.location || location,
        experience: aiResumeData.experience || experience,
        experienceYears: aiResumeData.experienceYears || 0,
      }
    } catch (error) {
      console.error("Error using AI for resume parsing:", error)
      // Continue with regex-extracted data
    }

    // Ensure we have some skills
    if (!resumeData.skills || resumeData.skills.length === 0) {
      resumeData.skills = ["Communication", "Teamwork", "Problem Solving"]
    }

    // Ensure location is set (default to Almaty if not found)
    if (!resumeData.location) {
      resumeData.location = "Алматы"
    }

    return NextResponse.json({
      success: true,
      resumeData,
      fileName: file.name,
    })
  } catch (error: any) {
    console.error("Error parsing resume:", error)
    return NextResponse.json({ error: error.message || "Failed to parse resume" }, { status: 500 })
  }
}
