import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Google API Key
const GOOGLE_API_KEY = "AIzaSyCLIB1yGy-lyyXbyWr5mebsmC46GCHx6Dk"

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// Fallback cover letter generator in case AI fails
function generateFallbackCoverLetter(resumeData: any, vacancyData: any): string {
  const name = resumeData?.name || "Кандидат"
  const company = vacancyData?.company || "Компания"
  const position = vacancyData?.title || "Должность"
  const skills = resumeData?.skills?.join(", ") || "профессиональные навыки"

  return `
Уважаемый работодатель,

Я с большим интересом ознакомился с вакансией ${position} в компании ${company} и хотел бы предложить свою кандидатуру на эту должность.

Изучив описание вакансии, я убедился, что мои навыки и опыт полностью соответствуют вашим требованиям. Я обладаю следующими навыками: ${skills}, что позволит мне эффективно выполнять поставленные задачи и вносить ценный вклад в работу вашей команды.

На предыдущих местах работы я успешно реализовал ряд проектов, которые помогли компаниям улучшить эффективность и качество продуктов. Я уверен, что смогу применить свой опыт и в вашей компании, способствуя ее дальнейшему развитию и успеху.

Буду рад обсудить мою кандидатуру более подробно на личном собеседовании. Спасибо за рассмотрение моего обращения.

С уважением,
${name}
  `.trim()
}

export async function POST(request: NextRequest) {
  try {
    const { resumeData, vacancyData } = await request.json()

    if (!resumeData || !vacancyData) {
      return NextResponse.json({ error: "Missing resume or vacancy data" }, { status: 400 })
    }

    try {
      // Get the Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Generate a personalized cover letter using Gemini
      const prompt = `
        Создайте профессиональное и персонализированное сопроводительное письмо для заявки на работу на русском языке.
        
        ИНФОРМАЦИЯ ИЗ РЕЗЮМЕ:
        Имя: ${resumeData.name || "Кандидат"}
        Навыки: ${resumeData.skills?.join(", ") || "Не указано"}
        Опыт работы: ${JSON.stringify(resumeData.experience || [])}
        Образование: ${JSON.stringify(resumeData.education || [])}
        Краткое описание: ${resumeData.summary || ""}
        
        ИНФОРМАЦИЯ О ВАКАНСИИ:
        Должность: ${vacancyData.title || "Должность"}
        Компания: ${vacancyData.company || "Компания"}
        Требования: ${vacancyData.requirements?.join(", ") || "Не указано"}
        Описание: ${vacancyData.description || ""}
        
        Сопроводительное письмо должно:
        1. Быть профессиональным и кратким (около 250-300 слов)
        2. Обращаться к компании по названию
        3. Подчеркивать соответствующие навыки и опыт, которые соответствуют требованиям работы
        4. Показывать энтузиазм к должности
        5. Заканчиваться призывом к действию
        6. Быть написанным на русском языке
        
        НЕ включайте дату или контактную информацию в письмо.
        Верните ТОЛЬКО текст сопроводительного письма без дополнительного форматирования.
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const coverLetter = response.text()

      return NextResponse.json({
        success: true,
        coverLetter: coverLetter.trim(),
      })
    } catch (error) {
      console.error("Error generating cover letter with AI:", error)

      // Use fallback cover letter generator
      const fallbackCoverLetter = generateFallbackCoverLetter(resumeData, vacancyData)

      return NextResponse.json({
        success: true,
        coverLetter: fallbackCoverLetter,
        fallback: true,
      })
    }
  } catch (error: any) {
    console.error("Error in cover letter generation route:", error)
    return NextResponse.json({ error: error.message || "Failed to generate cover letter" }, { status: 500 })
  }
}
