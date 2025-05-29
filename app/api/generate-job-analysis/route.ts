import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GOOGLE_API_KEY } from "@/constants/constants";

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// Fallback analysis generator in case AI fails
function generateFallbackAnalysis(vacancyData: any): { pros: string[]; cons: string[] } {
  const prosOptions = [
    "Стабильная компания с хорошей репутацией",
    "Возможности для профессионального развития",
    "Интересные и разнообразные задачи",
    "Работа с современными технологиями",
    "Дружный коллектив профессионалов",
  ]

  const consOptions = [
    "Высокие требования к кандидатам",
    "Возможны периодические переработки",
    "Высокая ответственность за результат",
    "Необходимость постоянного обучения",
  ]

  const pros = prosOptions.slice(0, 3)
  const cons = consOptions.slice(0, 2)

  return { pros, cons }
}

export async function POST(request: NextRequest) {
  try {
    const { vacancyData } = await request.json()

    if (!vacancyData) {
      return NextResponse.json({ error: "Missing vacancy data" }, { status: 400 })
    }

    try {
      // Get the Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Generate pros and cons analysis using Gemini
      const prompt = `
        Проанализируйте вакансию и создайте список преимуществ и недостатков для кандидата на русском языке.
        
        ИНФОРМАЦИЯ О ВАКАНСИИ:
        Должность: ${vacancyData.title || "Должность"}
        Компания: ${vacancyData.company || "Компания"}
        Зарплата: ${vacancyData.salary || "Не указано"}
        Локация: ${vacancyData.location || "Не указано"}
        Тип занятости: ${vacancyData.type || "Не указано"}
        Опыт: ${vacancyData.experience || "Не указано"}
        Требования: ${vacancyData.requirements?.join(", ") || "Не указано"}
        Описание: ${vacancyData.description || ""}
        
        ВАЖНО: Внимательно проанализируйте поле "Опыт". Если там указано что-то вроде "3-5 лет" или "от 3 до 6 лет", 
        это означает, что требуется опыт работы, а не то, что вакансия подходит для кандидатов без опыта.
        
        Создайте анализ в следующем формате JSON:
        {
          "pros": ["преимущество 1 (подробное)", "преимущество 2 (подробное)", "преимущество 3 (подробное)", "преимущество 4 (подробное)"],
          "cons": ["недостаток 1 (подробный)", "недостаток 2 (подробный)", "недостаток 3 (подробный)"]
        }
        
        Требования:
        1. Преимущества (4 пункта) - что хорошего в этой вакансии для кандидата
        2. Недостатки (3 пункта) - потенциальные сложности или минусы
        3. Каждый пункт должен быть подробным (до 70 символов)
        4. Основывайтесь на реальных данных вакансии
        5. Будьте объективными и реалистичными
        
        Верните ТОЛЬКО JSON без дополнительного текста или форматирования.
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const analysisText = response.text().trim()

      // Try to parse JSON response
      let analysis
      try {
        // Remove any markdown formatting if present
        const cleanText = analysisText.replace(/```json\n?|\n?```/g, "").trim()
        analysis = JSON.parse(cleanText)
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError)
        throw new Error("Invalid JSON response from AI")
      }

      // Validate the response structure
      if (!analysis.pros || !analysis.cons || !Array.isArray(analysis.pros) || !Array.isArray(analysis.cons)) {
        throw new Error("Invalid analysis structure")
      }

      return NextResponse.json({
        success: true,
        pros: analysis.pros.slice(0, 4), // Ensure max 4 pros
        cons: analysis.cons.slice(0, 3), // Ensure max 3 cons
      })
    } catch (error) {
      console.error("Error generating job analysis with AI:", error)

      // Use fallback analysis generator
      const fallbackAnalysis = generateFallbackAnalysis(vacancyData)

      return NextResponse.json({
        success: true,
        pros: fallbackAnalysis.pros,
        cons: fallbackAnalysis.cons,
        fallback: true,
      })
    }
  } catch (error: any) {
    console.error("Error in job analysis generation route:", error)
    return NextResponse.json({ error: error.message || "Failed to generate job analysis" }, { status: 500 })
  }
}