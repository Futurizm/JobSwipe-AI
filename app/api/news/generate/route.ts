import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GOOGLE_API_KEY } from "@/constants/constants"
// Google API Key from environment variables

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  category: string
  publishedAt: string
  source: string
  relevanceScore: number
  tags: string[]
  readTime: string
  imageUrl: string
}

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Google API key is not configured" }, { status: 500 })
    }
    const { resumeData, category = "all", page = 1, limit = 8 } = await request.json()

    try {
      // Get the Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Extract keywords from resume (only for personalized categories)
      const skills = resumeData?.skills || []
      const experience = resumeData?.experience || ""
      const location = resumeData?.location || "Казахстан"

      // Create category-specific prompts with more precise targeting
      let categoryPrompt = ""
      let usePersonalization = true

      switch (category) {
        case "tech":
          categoryPrompt = `
            ТЕХНОЛОГИЧЕСКИЕ НОВОСТИ:
            - Новые технологии и инновации в IT
            - Обновления популярных фреймворков и языков программирования
            - Релизы новых версий программного обеспечения
            - Тренды в разработке (AI/ML, веб-разработка, мобильная разработка)
            - Новости крупных IT-компаний (Google, Microsoft, Apple, Meta)
            - Стартапы и инвестиции в технологический сектор
            - Кибербезопасность и защита данных
            - Облачные технологии и DevOps
          `
          break
        case "business":
          categoryPrompt = `
            БИЗНЕС НОВОСТИ:
            - Экономические тренды и рыночная аналитика
            - Новости фондового рынка и инвестиций
            - Слияния и поглощения компаний
            - Новые бизнес-модели и стратегии
            - Предпринимательство и стартап-экосистема
            - Корпоративные новости крупных компаний
            - Изменения в законодательстве, влияющие на бизнес
            - Международная торговля и экономические отношения
          `
          break
        case "career":
          categoryPrompt = `
            КАРЬЕРНЫЕ НОВОСТИ:
            - Тренды на рынке труда и востребованные профессии
            - Изменения в зарплатах и компенсационных пакетах
            - Новые подходы к найму и HR-практики
            - Удаленная работа и гибридные форматы
            - Профессиональное развитие и обучение
            - Корпоративная культура и employee experience
            - Новости о крупных увольнениях или наймах
            - Изменения в трудовом законодательстве
          `
          break
        case "industry":
          if (skills.length === 0) {
            categoryPrompt = `
              ОТРАСЛЕВЫЕ НОВОСТИ (ОБЩИЕ):
              - Новости различных отраслей экономики
              - Производство и промышленность
              - Финансовые услуги и банковский сектор
              - Здравоохранение и фармацевтика
              - Образование и наука
              - Транспорт и логистика
              - Энергетика и природные ресурсы
              - Розничная торговля и e-commerce
            `
          } else {
            categoryPrompt = `
              ОТРАСЛЕВЫЕ НОВОСТИ ДЛЯ СПЕЦИАЛИСТА:
              Создай новости, специфичные для отраслей, связанных с навыками: ${skills.join(", ")}
              - Новости компаний в соответствующих отраслях
              - Изменения в отраслевых стандартах и регулировании
              - Новые продукты и услуги в этих сферах
              - Отраслевые события и конференции
              - Влияние технологий на эти отрасли
            `
          }
          break
        case "general":
          usePersonalization = false
          categoryPrompt = `
            ОБЩИЕ НОВОСТИ:
            - Важные мировые события и политические новости
            - Социальные и культурные тренды
            - Научные открытия и исследования
            - Экологические новости и устойчивое развитие
            - Спортивные достижения и события
            - Развлечения и медиа-индустрия
            - Образование и социальные инициативы
            - Здоровье и медицинские прорывы
            
            ВАЖНО: Эти новости должны быть общего характера и НЕ привязаны к конкретному профилю пользователя.
          `
          break
        default:
          categoryPrompt = `
            СМЕШАННЫЕ НОВОСТИ:
            - Технологии и инновации
            - Бизнес и экономика
            - Карьера и рынок труда
            - Отраслевые новости
          `
      }

      // Build the main prompt
      let mainPrompt = `
        Создай ${limit} актуальных новостных статей на русском языке.
        
        ${categoryPrompt}
      `

      // Add personalization only for relevant categories
      if (usePersonalization && resumeData && (skills.length > 0 || experience)) {
        mainPrompt += `
        
        ПЕРСОНАЛИЗАЦИЯ (учитывай при создании новостей):
        Навыки пользователя: ${skills.join(", ") || "Не указаны"}
        Опыт: ${experience || "Не указан"}
        Локация: ${location}
        
        Сделай новости более релевантными для этого профиля, но сохраняй фокус на выбранной категории.
        `
      }

      mainPrompt += `
        
        Новости должны быть:
        1. Актуальными (как будто опубликованы в последние 1-7 дней)
        2. Достоверными и реалистичными
        3. Соответствующими выбранной категории
        4. Профессионально написанными
        
        Верни ТОЛЬКО валидный JSON массив в следующем формате:
        [
          {
            "id": "news_1",
            "title": "Заголовок новости (максимум 80 символов)",
            "summary": "Краткое описание новости в 1-2 предложениях",
            "content": "Полный текст новости (200-300 слов) с подробностями и анализом",
            "category": "${getCategoryDisplayName(category)}",
            "publishedAt": "2024-01-15T10:30:00Z",
            "source": "Название источника новостей",
            "relevanceScore": 85,
            "tags": ["тег1", "тег2", "тег3"],
            "readTime": "2 мин",
            "imageUrl": "/placeholder.svg?height=200&width=400"
          }
        ]
        
        ВАЖНЫЕ ТРЕБОВАНИЯ:
        - Все новости на русском языке
        - Даты должны быть в пределах последних 7 дней от текущей даты
        - relevanceScore от 70 до 95 ${usePersonalization ? "на основе соответствия профилю пользователя" : "случайным образом"}
        - Теги должны соответствовать тематике новости
        - Источники должны быть реалистичными:
          * Для технологий: "Хабр", "TechCrunch Россия", "CNews", "3DNews"
          * Для бизнеса: "РБК", "Ведомости", "Коммерсант", "Forbes Россия"
          * Для карьеры: "HeadHunter", "Работа.ру", "HR-Portal", "Superjob"
          * Для отрасли: отраслевые издания
          * Для общих: "Лента.ру", "РИА Новости", "ТАСС", "Интерфакс"
        - readTime: "1 мин", "2 мин", "3 мин", "4 мин", "5 мин"
        
        НЕ добавляй никакого дополнительного текста, комментариев или объяснений.
        Только чистый JSON массив без markdown форматирования.
      `

      const result = await model.generateContent(mainPrompt)
      const response = await result.response
      let newsText = response.text().trim()

      // Clean the response more thoroughly
      newsText = newsText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .replace(/^\s*[\r\n]/gm, "")
        .trim()

      // Find JSON array in the response
      const jsonStart = newsText.indexOf("[")
      const jsonEnd = newsText.lastIndexOf("]") + 1

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("No valid JSON array found in response")
      }

      const jsonString = newsText.substring(jsonStart, jsonEnd)

      // Parse the JSON response
      const aiNews = JSON.parse(jsonString)

      // Validate the response structure
      if (!Array.isArray(aiNews) || aiNews.length === 0) {
        throw new Error("Invalid response: expected array with news articles")
      }

      // Validate and clean each news article
      const validatedNews = aiNews.slice(0, limit).map((article: any, index: number) => {
        // Validate required fields
        if (!article.title || !article.summary) {
          throw new Error(`Invalid news article at index ${index}`)
        }

        return {
          id: article.id || `news_${Date.now()}_${index}`,
          title: String(article.title).trim(),
          summary: String(article.summary).trim(),
          content: String(article.content || article.summary).trim(),
          category: String(article.category || getCategoryDisplayName(category)).trim(),
          publishedAt:
            article.publishedAt || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          source: String(article.source || getDefaultSource(category)).trim(),
          relevanceScore: Math.min(95, Math.max(70, Number(article.relevanceScore) || (usePersonalization ? 80 : Math.floor(Math.random() * 25) + 70))),
          tags: Array.isArray(article.tags) ? article.tags.slice(0, 5).map((tag: any) => String(tag).trim()) : [],
          readTime: String(article.readTime || "2 мин").trim(),
          imageUrl: "/placeholder.svg?height=200&width=400",
        }
      })

      return NextResponse.json({
        success: true,
        news: validatedNews,
        totalPages: Math.ceil(20 / limit), // Simulate pagination
        currentPage: page,
        category,
        personalized: usePersonalization && resumeData && (skills.length > 0 || experience),
      })
    } catch (aiError: any) {
      console.error("AI generation error:", aiError)

      // Enhanced fallback based on category
      const fallbackNews = generateFallbackNews(resumeData, category, limit)

      return NextResponse.json({
        success: true,
        news: fallbackNews,
        totalPages: 3,
        currentPage: page,
        category,
        fallback: true,
        error: aiError.message,
      })
    }
  } catch (error: any) {
    console.error("Error in news generation route:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to generate news",
      },
      { status: 500 },
    )
  }
}

// Helper function to get category display name
function getCategoryDisplayName(category: string): string {
  switch (category) {
    case "tech":
      return "Технологии"
    case "business":
      return "Бизнес"
    case "career":
      return "Карьера"
    case "industry":
      return "Отрасль"
    case "general":
      return "Общее"
    default:
      return "Смешанное"
  }
}

// Helper function to get default source by category
function getDefaultSource(category: string): string {
  switch (category) {
    case "tech":
      return "TechNews"
    case "business":
      return "Бизнес-портал"
    case "career":
      return "Карьерный портал"
    case "industry":
      return "Отраслевые новости"
    case "general":
      return "Новостной портал"
    default:
      return "Новостной портал"
  }
}

// Enhanced fallback news generator
function generateFallbackNews(resumeData: any, category: string, limit: number): NewsArticle[] {
  const skills = resumeData?.skills || []
  const location = resumeData?.location || "Казахстан"

  const fallbackNewsByCategory = {
    tech: [
      {
        id: "tech_fallback_1",
        title: "OpenAI представила новую модель GPT-4 Turbo с улучшенными возможностями",
        summary: "Компания OpenAI анонсировала обновленную версию языковой модели с повышенной скоростью работы и расширенным контекстным окном.",
        content: "OpenAI представила GPT-4 Turbo - значительно улучшенную версию своей флагманской языковой модели. Новая модель демонстрирует повышенную скорость обработки запросов и может работать с контекстом до 128,000 токенов. Это открывает новые возможности для разработчиков в создании более сложных AI-приложений. Компания также снизила стоимость использования API, что делает технологию более доступной для стартапов и малого бизнеса.",
        category: "Технологии",
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        source: "TechCrunch Россия",
        relevanceScore: 92,
        tags: ["OpenAI", "GPT-4", "ИИ", "разработка"],
        readTime: "3 мин",
        imageUrl: "/placeholder.svg?height=200&width=400",
      },
      {
        id: "tech_fallback_2",
        title: "React 19 выходит с революционными изменениями в архитектуре",
        summary: "Новая версия популярного фреймворка React включает серверные компоненты по умолчанию и улучшенную систему состояний.",
        content: "Команда React анонсировала выход React 19 с кардинальными изменениями в архитектуре фреймворка. Основные нововведения включают встроенную поддержку серверных компонентов, новый компилятор React Compiler и улучшенную систему управления состоянием. Эти изменения обещают значительно повысить производительность приложений и упростить разработку. Миграция с предыдущих версий потребует обновления кодовой базы, но команда предоставила подробные гайды по переходу.",
        category: "Технологии",
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        source: "Хабр",
        relevanceScore: 89,
        tags: ["React", "фронтенд", "веб-разработка", "JavaScript"],
        readTime: "4 мин",
        imageUrl: "/placeholder.svg?height=200&width=400",
      },
    ],
    business: [
      {
        id: "business_fallback_1",
        title: "Российские IT-компании увеличили выручку на 25% в 2024 году",
        summary: "Несмотря на сложную экономическую ситуацию, технологический сектор демонстрирует устойчивый рост благодаря внутреннему спросу.",
        content: "По данным аналитического агентства, российские IT-компании показали рекордный рост выручки в 2024 году. Основными драйверами стали увеличение спроса на цифровизацию бизнес-процессов, развитие собственных технологических решений и импортозамещение. Особенно выросли сегменты разработки корпоративного ПО, кибербезопасности и облачных сервисов. Эксперты прогнозируют сохранение положительной динамики в следующем году при условии продолжения государственной поддержки отрасли.",
        category: "Бизнес",
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        source: "РБК",
        relevanceScore: 85,
        tags: ["IT-бизнес", "выручка", "рост", "Россия"],
        readTime: "3 мин",
        imageUrl: "/placeholder.svg?height=200&width=400",
      },
      {
        id: "business_fallback_2",
        title: "Венчурные инвестиции в стартапы выросли на 40% в четвертом квартале",
        summary: "Инвесторы активно вкладывают средства в технологические стартапы, особенно в сферах FinTech и HealthTech.",
        content: "Венчурный рынок показал значительное оживление в конце 2024 года. Общий объем инвестиций в стартапы вырос на 40% по сравнению с предыдущим кварталом. Наибольший интерес инвесторы проявляют к проектам в области финансовых технологий, медицинских решений и искусственного интеллекта. Средний размер раунда увеличился до $2.5 млн. Эксперты связывают рост с восстановлением доверия инвесторов и появлением качественных проектов на рынке.",
        category: "Бизнес",
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        source: "Ведомости",
        relevanceScore: 83,
        tags: ["венчурные инвестиции", "стартапы", "FinTech", "рост"],
        readTime: "2 мин",
        imageUrl: "/placeholder.svg?height=200&width=400",
      },
    ],
    career: [
      {
        id: "career_fallback_1",
        title: "Зарплаты IT-специалистов выросли на 18% за год",
        summary: "Исследование рынка труда показывает значительный рост доходов в технологическом секторе на фоне дефицита кадров.",
        content: "По данным крупнейших рекрутинговых агентств, средняя зарплата IT-специалистов в России выросла на 18% за последний год. Наибольший рост зафиксирован в сегментах машинного обучения (+25%), кибербезопасности (+22%) и DevOps (+20%). Дефицит квалифицированных кадров заставляет компании предлагать более высокие зарплаты и расширенные социальные пакеты. Эксперты прогнозируют дальнейший рост доходов IT-специалистов в 2025 году.",
        category: "Карьера",
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        source: "HeadHunter",
        relevanceScore: 90,
        tags: ["зарплаты", "IT", "рынок труда", "рост"],
        readTime: "3 мин",
        imageUrl: "/placeholder.svg?height=200&width=400",
      },
      {
        id: "career_fallback_2",
        title: "Удаленная работа становится стандартом для 70% IT-компаний",
        summary: "Исследование показывает, что большинство технологических компаний окончательно перешли на гибридный или полностью удаленный формат работы.",
        content: "Согласно новому исследованию, 70% IT-компаний в России предлагают сотрудникам возможность полностью удаленной работы или гибридного формата. Это кардинально изменило подходы к найму - компании теперь могут привлекать таланты из любых регионов. Сотрудники отмечают повышение продуктивности и улучшение work-life баланса. Однако появились новые вызовы в области командной работы и корпоративной культуры, которые компании активно решают с помощью новых инструментов и методологий.",
        category: "Карьера",
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        source: "Работа.ру",
        relevanceScore: 87,
        tags: ["удаленная работа", "IT", "гибридный формат", "тренды"],
        readTime: "2 мин",
        imageUrl: "/placeholder.svg?height=200&width=400",
      },
    ],
    industry: [
      {
        id: "industry_fallback_1",
        title: "Банковский сектор инвестирует $5 млрд в цифровую трансформацию",
        summary: "Крупнейшие банки России запускают масштабные программы модернизации IT-инфраструктуры и внедрения новых технологий.",
        content: "Российские банки планируют инвестировать рекордные $5 млрд в цифровую трансформацию в 2025 году. Основные направления инвестиций включают развитие мобильных приложений, внедрение искусственного интеллекта для анализа рисков, создание экосистемных продуктов и модернизацию core-систем. Банки также активно развивают партнерства с финтех-стартапами и инвестируют в собственные R&D центры. Эксперты ожидают, что эти инвестиции кардинально изменят клиентский опыт в банковской сфере.",
        category: "Отрасль",
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        source: "Банковское обозрение",
        relevanceScore: 82,
        tags: ["банки", "цифровизация", "инвестиции", "финтех"],
        readTime: "3 мин",
        imageUrl: "/placeholder.svg?height=200&width=400",
      },
    ],
    general: [
      {
        id: "general_fallback_1",
        title: "Ученые создали новый материал для солнечных батарей с КПД 47%",
        summary: "Исследователи разработали революционную технологию, которая может кардинально изменить индустрию возобновляемой энергетики.",
        content: "Международная группа ученых представила новый материал для солнечных панелей, который демонстрирует рекордный коэффициент полезного действия в 47%. Это почти в два раза превышает эффективность современных коммерческих солнечных батарей. Новая технология основана на использовании перовскитных структур с добавлением наночастиц. Ученые утверждают, что массовое производство таких панелей может начаться уже через 3-5 лет, что значительно снизит стоимость солнечной энергии.",
        category: "Общее",
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        source: "Наука и жизнь",
        relevanceScore: 75,
        tags: ["наука", "солнечная энергия", "технологии", "экология"],
        readTime: "3 мин",
        imageUrl: "/placeholder.svg?height=200&width=400",
      },
    ],
  }

  // Get fallback news for the specific category
  let categoryNews = fallbackNewsByCategory[category as keyof typeof fallbackNewsByCategory] || fallbackNewsByCategory.general

  // Adjust relevance based on user skills for personalized categories
  if (skills.length > 0 && category !== "general") {
    categoryNews = categoryNews.map((news) => {
      let relevanceBoost = 0
      skills.forEach((skill: string) => {
        if (
          news.content.toLowerCase().includes(skill.toLowerCase()) ||
          news.tags.some((tag) => tag.toLowerCase().includes(skill.toLowerCase()))
        ) {
          relevanceBoost += 5
        }
      })
      return {
        ...news,
        relevanceScore: Math.min(95, news.relevanceScore + relevanceBoost),
      }
    })
  }

  return categoryNews.slice(0, limit)
}