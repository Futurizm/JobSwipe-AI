import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Google API Key
const GOOGLE_API_KEY = "AIzaSyCLIB1yGy-lyyXbyWr5mebsmC46GCHx6Dk"

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// Function to extract text from resume content
function extractTextFromResume(fileContent: string, fileType: string): string {
  // For PDF and DOCX, we'd normally use specialized libraries
  // For this implementation, we'll use the raw content
  return fileContent
}

// Function to extract skills using regex patterns as fallback
function extractSkillsWithRegex(text: string): string[] {
  // Common tech skills regex patterns
  const techSkillsPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|PHP|Swift|Kotlin|Go|Rust)\b/gi,
    /\b(React|Angular|Vue|Node\.js|Express|Django|Flask|Spring|Laravel|ASP\.NET)\b/gi,
    /\b(HTML|CSS|SASS|LESS|Bootstrap|Tailwind|Material-UI|Chakra UI)\b/gi,
    /\b(SQL|MySQL|PostgreSQL|MongoDB|Firebase|DynamoDB|Cassandra|Redis)\b/gi,
    /\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|Git|CI\/CD|DevOps)\b/gi,
    /\b(Machine Learning|Deep Learning|AI|NLP|Computer Vision|Data Science|Big Data)\b/gi,
    /\b(Agile|Scrum|Kanban|JIRA|Confluence|Project Management)\b/gi,
  ]

  // Russian tech skills patterns
  const russianTechSkillsPatterns = [
    /\b(Программирование|Разработка|Тестирование|Аналитика|Дизайн)\b/gi,
    /\b(Фронтенд|Бэкенд|Фулстек|Веб-разработка|Мобильная разработка)\b/gi,
    /\b(Базы данных|Сети|Безопасность|Облачные технологии)\b/gi,
    /\b(Управление проектами|Методологии разработки|Командная работа)\b/gi,
  ]

  // Combine all patterns
  const allPatterns = [...techSkillsPatterns, ...russianTechSkillsPatterns]

  // Extract skills using regex
  const skills = new Set<string>()

  allPatterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach((match) => skills.add(match))
    }
  })

  // Extract skills from common formats like "Skills: skill1, skill2, skill3"
  const skillSectionRegex = /(?:навыки|skills|умения|технологии|technologies)[:：]([^.]*)/gi
  const skillSections = text.match(skillSectionRegex)

  if (skillSections) {
    skillSections.forEach((section) => {
      const skillList = section.split(/[:：]/)[1]
      if (skillList) {
        const individualSkills = skillList.split(/[,;、]/).map((s) => s.trim())
        individualSkills.forEach((skill) => {
          if (skill && skill.length > 1 && skill.length < 30) {
            skills.add(skill)
          }
        })
      }
    })
  }

  return Array.from(skills)
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
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT file" },
        { status: 400 },
      )
    }

    // Read file content
    const fileBuffer = await file.arrayBuffer()
    const fileContent = new TextDecoder().decode(fileBuffer)

    // Extract text from resume
    const resumeText = extractTextFromResume(fileContent, fileType)

    // First try to extract skills using regex as a quick fallback
    const regexSkills = extractSkillsWithRegex(resumeText)

    // Initialize default resumeData with regex-extracted skills
    let resumeData = {
      name: "",
      email: "",
      phone: "",
      skills: regexSkills,
      experience: [],
      education: [],
      summary: "",
    }

    try {
      // Try to use Gemini for better extraction
      // Get the Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Generate content with Gemini
      const prompt = `
        Extract structured information from this resume text and return ONLY a valid JSON object with no additional text or formatting. 
        
        Required JSON structure:
        {
          "name": "The person's full name",
          "email": "Email address",
          "phone": "Phone number",
          "skills": ["Array", "of", "skills"],
          "experience": [
            {
              "company": "Company name",
              "position": "Job title",
              "duration": "Time period",
              "description": "Job description"
            }
          ],
          "education": [
            {
              "institution": "School/University name",
              "degree": "Degree/Certificate",
              "year": "Graduation year"
            }
          ],
          "summary": "A brief professional summary"
        }
        
        Resume text:
        ${resumeText.substring(0, 8000)}
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const parsedResume = response.text()

      // Clean the response to extract JSON
      let cleanedResponse = parsedResume.trim()

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, "").replace(/\n?```$/, "")
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, "").replace(/\n?```$/, "")
      }

      // Parse the JSON response
      const aiResumeData = JSON.parse(cleanedResponse)

      // Merge AI-extracted data with regex-extracted skills
      resumeData = {
        ...aiResumeData,
        // Combine AI-extracted skills with regex-extracted skills
        skills: [...new Set([...(aiResumeData.skills || []), ...regexSkills])],
      }
    } catch (error) {
      console.error("Error using AI for resume parsing:", error)
      // Continue with regex-extracted data if AI parsing fails
    }

    // If we still have no skills, add some default ones based on the file name
    if (!resumeData.skills || resumeData.skills.length === 0) {
      const fileName = file.name.toLowerCase()
      const defaultSkills = []

      if (fileName.includes("dev") || fileName.includes("разраб")) {
        defaultSkills.push("Programming", "Development", "Coding")
      }
      if (fileName.includes("web") || fileName.includes("веб")) {
        defaultSkills.push("HTML", "CSS", "JavaScript")
      }
      if (fileName.includes("design") || fileName.includes("дизайн")) {
        defaultSkills.push("UI/UX", "Figma", "Design")
      }

      // Add some generic skills if we still have none
      if (defaultSkills.length === 0) {
        defaultSkills.push("Communication", "Teamwork", "Problem Solving", "Time Management")
      }

      resumeData.skills = defaultSkills
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
