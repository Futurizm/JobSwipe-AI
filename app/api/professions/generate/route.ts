import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Google API Key
const GOOGLE_API_KEY = "AIzaSyCLIB1yGy-lyyXbyWr5mebsmC46GCHx6Dk"

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { resumeData } = await request.json()

    if (!resumeData) {
      return NextResponse.json({ error: "Missing resume data" }, { status: 400 })
    }

    try {
      // Get the Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Create comprehensive prompt for any profession analysis
      const prompt = `
        Ты - эксперт по карьерному консультированию и анализу рынка труда в Казахстане. 
        Проанализируй данные резюме и создай персонализированные рекомендации профессий для ЛЮБОЙ сферы деятельности.
        
        ДАННЫЕ РЕЗЮМЕ:
        Имя: ${resumeData.name || "Не указано"}
        Локация: ${resumeData.location || "Казахстан"}
        Навыки: ${resumeData.skills?.join(", ") || "Не указано"}
        Опыт раб��ты: ${resumeData.experience || "Не указано"}
        Лет опыта: ${resumeData.experienceYears || 0}
        Образование: ${JSON.stringify(resumeData.education || [])}
        Краткое описание: ${resumeData.summary || ""}
        
        На основе этих данных создай МИНИМУМ 3 и МАКСИМУМ 5 наиболее подходящих профессий из ЛЮБЫХ сфер:
        - IT и технологии
        - Образование и наука
        - Медицина и здравоохранение
        - Кулинария и общественное питание
        - Бизнес и менеджмент
        - Продажи и маркетинг
        - Финансы и банковское дело
        - Строительство и архитектура
        - Транспорт и логистика
        - Искусство и творчество
        - Сельское хозяйство
        - Туризм и гостеприимство
        - Спорт и фитнес
        - Юриспруденция
        - И любые другие сферы
        
        Для каждой профессии проанализируй:
        1. Насколько навыки и опыт кандидата соответствуют требованиям профессии (matchPercentage)
        2. Реальную зарплатную вилку в Казахстане в 2024 году (в тенге)
        3. Текущий уровень спроса на эту профессию в Казахстане
        4. Конкретные навыки, которые требуются для этой профессии
        5. Реальные перспективы карьерного роста
        6. Примерное количество вакансий на рынке Казахстана
        
        Верни ТОЛЬКО валидный JSON массив в следующем формате:
        [
          {
            "id": 1,
            "title": "Конкретное название профессии",
            "description": "Подробное описание того, чем занимается специалист в этой профессии (2-3 предложения)",
            "matchPercentage": 87,
            "averageSalary": "200 000 - 350 000 ₸",
            "demandLevel": "Высокий",
            "requiredSkills": ["навык1", "навык2", "навык3", "навык4"],
            "growthProspects": "Детальное описание карьерных перспектив и возможностей роста в этой профессии",
            "vacanciesCount": 450
          }
        ]
        
        СПЕЦИАЛЬНЫЕ ИНСТРУКЦИИ ПО АНАЛИЗУ:
        - Если в резюме есть слова "повар", "кулинар", "кухня", "ресторан" - ОБЯЗАТЕЛЬНО включи профессии: Повар, Су-шеф, Шеф-повар, Кондитер, Технолог общественного питания
        - Если есть "учитель", "преподаватель", "педагог", "образование" - включи: Учитель, Преподаватель, Методист, Воспитатель
        - Если есть "врач", "медицина", "медсестра", "здравоохранение" - включи: Врач, Медсестра, Фельдшер, Медицинский администратор
        - Если есть "программист", "разработчик", "IT", "код" - включи: Программист, Веб-разработчик, Системный администратор
        - Если есть "продавец", "менеджер", "продажи" - включи: Менеджер по продажам, Консультант, Торговый представитель

        ВАЖНО: НЕ предлагай профессии, которые НЕ связаны с навыками и опытом кандидата!
        Например, если это резюме повара - НЕ предлагай кладовщика, консультанта или IT-специалиста.
        
        ВАЖНЫЕ ТРЕБОВАНИЯ:
        - matchPercentage должен быть реалистичным (50-95%) на основе РЕАЛЬНОГО анализа соответствия навыков
        - demandLevel: только "Высокий", "Средний" или "Низкий" на основе текущего рынка труда Казахстана
        - averageSalary: актуальные зарплаты в тенге для Казахстана в 2024 году
        - requiredSkills: конкретные навыки, которые действительно нужны для этой профессии
        - vacanciesCount: реалистичное количество вакансий в Казахстане (50-1500)
        - Профессии должны быть актуальными и востребованными в Казахстане
        - Учитывай уровень опыта кандидата при расчете зарплаты и позиции
        - Если у кандидата мало опыта, предлагай junior/начальные позиции
        - Если много опыта, предлагай senior/руководящие позиции
        - Анализируй ВСЕ навыки, не только IT
        - Если навыки связаны с образованием - предлагай педагогические профессии
        - Если навыки связаны с кулинарией - предлагай профессии повара, кондитера
        - Если навыки связаны с медициной - предлагай медицинские профессии
        - И так далее для всех сфер деятельности
        
        НЕ добавляй никакого дополнительного текста, комментариев или объяснений. 
        Только чистый JSON массив без markdown форматирования.
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      let professionsText = response.text().trim()

      // Clean the response more thoroughly
      professionsText = professionsText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .replace(/^\s*[\r\n]/gm, "")
        .trim()

      // Find JSON array in the response
      const jsonStart = professionsText.indexOf("[")
      const jsonEnd = professionsText.lastIndexOf("]") + 1

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("No valid JSON array found in response")
      }

      const jsonString = professionsText.substring(jsonStart, jsonEnd)

      // Parse the JSON response
      const aiProfessions = JSON.parse(jsonString)

      // Validate the response structure
      if (!Array.isArray(aiProfessions) || aiProfessions.length < 3) {
        throw new Error("Invalid response: expected array with at least 3 professions")
      }

      // Validate and clean each profession object
      const validatedProfessions = aiProfessions.slice(0, 5).map((prof: any, index: number) => {
        // Validate required fields
        if (!prof.title || !prof.description) {
          throw new Error(`Invalid profession data at index ${index}`)
        }

        // Проверяем релевантность профессии к навыкам
        const professionTitle = String(prof.title).toLowerCase()
        const userSkills = resumeData.skills.join(" ").toLowerCase()

        // Если профессия не связана с навыками пользователя, снижаем процент соответствия
        let adjustedMatch = Number(prof.matchPercentage) || 70

        if (userSkills.includes("повар") || userSkills.includes("кулинар")) {
          if (
            !professionTitle.includes("повар") &&
            !professionTitle.includes("кулинар") &&
            !professionTitle.includes("кондитер") &&
            !professionTitle.includes("шеф")
          ) {
            adjustedMatch = Math.max(30, adjustedMatch - 40) // Сильно снижаем для несвязанных профессий
          }
        }

        return {
          id: index + 1,
          title: String(prof.title).trim(),
          description: String(prof.description).trim(),
          matchPercentage: Math.min(95, Math.max(30, adjustedMatch)),
          averageSalary: String(prof.averageSalary || "Не указано").trim(),
          demandLevel: ["Высокий", "Средний", "Низкий"].includes(prof.demandLevel) ? prof.demandLevel : "Средний",
          requiredSkills: Array.isArray(prof.requiredSkills)
            ? prof.requiredSkills.slice(0, 6).map((skill: any) => String(skill).trim())
            : [],
          growthProspects: String(prof.growthProspects || "Стабильные перспективы развития").trim(),
          vacanciesCount: Math.min(1500, Math.max(50, Number(prof.vacanciesCount) || 200)),
        }
      })

      // Ensure we have at least 3 professions
      if (validatedProfessions.length < 3) {
        throw new Error("Not enough valid professions generated")
      }

      return NextResponse.json({
        success: true,
        professions: validatedProfessions,
      })
    } catch (aiError: any) {
      console.error("AI generation error:", aiError)

      // Enhanced fallback based on comprehensive resume analysis
      const fallbackProfessions = generateUniversalFallback(resumeData)

      return NextResponse.json({
        success: true,
        professions: fallbackProfessions,
        fallback: true,
        error: aiError.message,
      })
    }
  } catch (error: any) {
    console.error("Error in profession generation route:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to generate profession recommendations",
      },
      { status: 500 },
    )
  }
}

// Universal fallback that analyzes resume data for any profession
function generateUniversalFallback(resumeData: any): any[] {
  const skills = resumeData?.skills || []
  const experience = resumeData?.experience || ""
  const experienceYears = resumeData?.experienceYears || 0
  const education = resumeData?.education || []
  const location = resumeData?.location || "Алматы"

  const professions = []

  // Determine experience level
  const experienceLevel = experienceYears > 5 ? "senior" : experienceYears > 2 ? "middle" : "junior"

  // Analyze skills and experience text for profession keywords
  const allText = `${skills.join(" ")} ${experience} ${education.map((e) => e.degree || "").join(" ")}`.toLowerCase()

  const isProfessionRelated = {
    cooking:
      /повар|кулинар|кухня|ресторан|общепит|кондитер|шеф|су-шеф|технолог питания|cook|chef|culinary|kitchen|restaurant/i.test(
        allText,
      ),
    teaching:
      /учитель|преподаватель|педагог|образование|школа|университет|методист|воспитатель|teacher|education|instructor/i.test(
        allText,
      ),
    medical: /врач|медицина|медсестра|фельдшер|здравоохранение|клиника|больница|doctor|nurse|medical|healthcare/i.test(
      allText,
    ),
    tech: /программист|разработчик|it|код|веб|сайт|приложение|developer|programmer|software|web/i.test(allText),
    sales: /продажи|менеджер|консультант|торговля|клиент|продавец|sales|manager|consultant|retail/i.test(allText),
  }

  // Generate professions based on detected profession type
  const teachingSkills: string[] =
    resumeData?.skills?.filter((skill: string) => /педагог|образование|обучение|преподавание/i.test(skill)) || []
  const cookingSkills: string[] =
    resumeData?.skills?.filter((skill: string) => /кулинар|повар|готовка|выпечка/i.test(skill)) || []
  const medicalSkills: string[] =
    resumeData?.skills?.filter((skill: string) => /медицин|здоровье|лечение|диагностика/i.test(skill)) || []
  const techSkills: string[] =
    resumeData?.skills?.filter((skill: string) => /программирование|разработка|it|веб|софт/i.test(skill)) || []
  const businessSkills: string[] =
    resumeData?.skills?.filter((skill: string) => /менеджмент|продажи|маркетинг|управление/i.test(skill)) || []
  const financeSkills: string[] =
    resumeData?.skills?.filter((skill: string) => /финансы|бухгалтер|экономика|налоги/i.test(skill)) || []

  if (isProfessionRelated.cooking) {
    professions.push({
      id: 1,
      title: experienceLevel === "senior" ? "Шеф-повар" : experienceLevel === "middle" ? "Су-шеф" : "Повар",
      description: "Приготовление блюд, планирование меню, контроль качества продуктов, управление кухней.",
      matchPercentage: 90,
      averageSalary: experienceLevel === "senior" ? "300 000 - 500 000 ₸" : "150 000 - 250 000 ₸",
      demandLevel: "Высокий",
      requiredSkills: ["Кулинария", "Санитарные нормы", "Планирование меню", "Управление кухней"],
      growthProspects: "Отличные перспективы в ресторанной индустрии. Возможность открытия собственного заведения.",
      vacanciesCount: 450,
    })

    professions.push({
      id: 2,
      title: "Кондитер",
      description: "Приготовление десертов, тортов, выпечки. Работа с кондитерскими изделиями и украшениями.",
      matchPercentage: 85,
      averageSalary: "120 000 - 220 000 ₸",
      demandLevel: "Средний",
      requiredSkills: ["Кондитерское дело", "Выпечка", "Декорирование", "Работа с тестом"],
      growthProspects: "Растущий спрос на качественные кондитерские изделия.",
      vacanciesCount: 200,
    })

    professions.push({
      id: 3,
      title: "Технолог общественного питания",
      description: "Разработка рецептур, контроль технологических процессов, обеспечение качества продукции.",
      matchPercentage: 80,
      averageSalary: "180 000 - 300 000 ₸",
      demandLevel: "Средний",
      requiredSkills: ["Технология питания", "Рецептуры", "Контроль качества", "ХАССП"],
      growthProspects: "Возможность работы в крупных ресторанных сетях и пищевых производствах.",
      vacanciesCount: 150,
    })
  }

  if (isProfessionRelated.teaching) {
    professions.push({
      id: professions.length + 1,
      title: experienceLevel === "senior" ? "Старший преподаватель" : "Преподаватель",
      description:
        "Обучение студентов и школьников, разработка учебных программ, проведение лекций и семинаров, оценка знаний учащихся.",
      matchPercentage: Math.min(90, 75 + teachingSkills.length * 5),
      averageSalary: experienceLevel === "senior" ? "200 000 - 350 000 ₸" : "120 000 - 250 000 ₸",
      demandLevel: "Средний",
      requiredSkills: ["Педагогика", "Методика преподавания", "Коммуникация", "Планирование уроков"],
      growthProspects:
        "Стабильная сфера с возможностью роста до заведующего кафедрой или директора учебного заведения. Востребованность в школах и вузах.",
      vacanciesCount: 650,
    })
  }

  if (isProfessionRelated.medical) {
    professions.push({
      id: professions.length + 1,
      title: experienceLevel === "senior" ? "Врач-специалист" : "Медицинский работник",
      description:
        "Диагностика и лечение пациентов, ведение медицинской документации, консультирование по вопросам здоровья.",
      matchPercentage: Math.min(92, 75 + medicalSkills.length * 5),
      averageSalary: experienceLevel === "senior" ? "300 000 - 600 000 ₸" : "180 000 - 320 000 ₸",
      demandLevel: "Высокий",
      requiredSkills: ["Медицинские знания", "Диагностика", "Работа с пациентами", "Медицинская этика"],
      growthProspects:
        "Высокий спрос на медицинских работников в Казахстане. Возможность специализации и работы в частных клиниках.",
      vacanciesCount: 900,
    })
  }

  if (isProfessionRelated.tech) {
    const matchPercentage = Math.min(95, 70 + techSkills.length * 4)
    const salaryRange =
      experienceLevel === "senior"
        ? "400 000 - 800 000 ₸"
        : experienceLevel === "middle"
          ? "250 000 - 450 000 ₸"
          : "150 000 - 300 000 ₸"

    professions.push({
      id: 1,
      title:
        `${experienceLevel === "junior" ? "Junior" : experienceLevel === "senior" ? "Senior" : ""} Разработчик ПО`.trim(),
      description: `Разработка программного обеспечения с использованием ${techSkills.slice(0, 3).join(", ")}. Создание веб-приложений, мобильных приложений и системного ПО.`,
      matchPercentage,
      averageSalary: salaryRange,
      demandLevel: "Высокий",
      requiredSkills: [...techSkills.slice(0, 4), "Git", "Алгоритмы"],
      growthProspects: `Отличные перспективы в IT-сфере Казахстана. Возможность роста до ${experienceLevel === "junior" ? "Middle/Senior разработчика" : "Tech Lead или архитектора"}. Высокий спрос на рынке труда.`,
      vacanciesCount: 850,
    })
  }

  if (isProfessionRelated.sales) {
    professions.push({
      id: professions.length + 1,
      title: experienceLevel === "senior" ? "Руководитель отдела продаж" : "Менеджер по продажам",
      description:
        "Управление командой продаж, планирование стратегий продаж, привлечение новых клиентов, ведение переговоров.",
      matchPercentage: Math.min(85, 65 + businessSkills.length * 4),
      averageSalary: experienceLevel === "senior" ? "350 000 - 700 000 ₸" : "200 000 - 400 000 ₸",
      demandLevel: "Средний",
      requiredSkills: ["Продажи", "Переговоры", "Лидерство", "Анализ рынка"],
      growthProspects:
        "Возможности карьерного роста до топ-менеджмента. Востребованность во всех отраслях экономики Казахстана.",
      vacanciesCount: 550,
    })
  }

  if (teachingSkills.length >= 1 && !isProfessionRelated.teaching) {
    professions.push({
      id: professions.length + 1,
      title: experienceLevel === "senior" ? "Старший преподаватель" : "Преподаватель",
      description:
        "Обучение студентов и школьников, разработка учебных программ, проведение лекций и семинаров, оценка знаний учащихся.",
      matchPercentage: Math.min(90, 75 + teachingSkills.length * 5),
      averageSalary: experienceLevel === "senior" ? "200 000 - 350 000 ₸" : "120 000 - 250 000 ₸",
      demandLevel: "Средний",
      requiredSkills: ["Педагогика", "Методика преподавания", "Коммуникация", "Планирование уроков"],
      growthProspects:
        "Стабильная сфера с возможностью роста до заведующего кафедрой или директора учебного заведения. Востребованность в школах и вузах.",
      vacanciesCount: 650,
    })
  }

  if (cookingSkills.length >= 1 && !isProfessionRelated.cooking) {
    professions.push({
      id: professions.length + 1,
      title: experienceLevel === "senior" ? "Шеф-повар" : "Повар",
      description:
        "Приготовление блюд, планирование меню, контроль качества продуктов, управление кухней и обучение младшего персонала.",
      matchPercentage: Math.min(88, 70 + cookingSkills.length * 6),
      averageSalary: experienceLevel === "senior" ? "250 000 - 450 000 ₸" : "120 000 - 220 000 ₸",
      demandLevel: "Высокий",
      requiredSkills: ["Кулинария", "Санитарные нормы", "Планирование меню", "Управление кухней"],
      growthProspects:
        "Растущий спрос в ресторанной индустрии Казахстана. Возможность открытия собственного ресторана или работы в международных сетях.",
      vacanciesCount: 750,
    })
  }

  if (
    (medicalSkills.length >= 1 && !isProfessionRelated.medical) ||
    education.some((edu: any) => /медицин|medical|health/i.test(edu.degree || ""))
  ) {
    professions.push({
      id: professions.length + 1,
      title: experienceLevel === "senior" ? "Врач-специалист" : "Медицинский работник",
      description:
        "Диагностика и лечение пациентов, ведение медицинской документации, консультирование по вопросам здоровья.",
      matchPercentage: Math.min(92, 75 + medicalSkills.length * 5),
      averageSalary: experienceLevel === "senior" ? "300 000 - 600 000 ₸" : "180 000 - 320 000 ₸",
      demandLevel: "Высокий",
      requiredSkills: ["Медицинские знания", "Диагностика", "Работа с пациентами", "Медицинская этика"],
      growthProspects:
        "Высокий спрос на медицинских работников в Казахстане. Возможность специализации и работы в частных клиниках.",
      vacanciesCount: 900,
    })
  }

  if (businessSkills.length >= 1 && !isProfessionRelated.sales) {
    professions.push({
      id: professions.length + 1,
      title: experienceLevel === "senior" ? "Руководитель отдела" : "Менеджер",
      description:
        "Управление командой, планирование бизнес-процессов, анализ показателей эффективности, развитие бизнеса.",
      matchPercentage: Math.min(85, 65 + businessSkills.length * 4),
      averageSalary: experienceLevel === "senior" ? "350 000 - 700 000 ₸" : "200 000 - 400 000 ₸",
      demandLevel: "Средний",
      requiredSkills: ["Менеджмент", "Лидерство", "Планирование", "Анализ данных"],
      growthProspects:
        "Возможности карьерного роста до топ-менеджмента. Востребованность во всех отраслях экономики Казахстана.",
      vacanciesCount: 550,
    })
  }

  if (financeSkills.length >= 1) {
    professions.push({
      id: professions.length + 1,
      title: experienceLevel === "senior" ? "Главный бухгалтер" : "Бухгалтер",
      description: "Ведение финансовой отчетности, расчет налогов, анализ финансовых показателей, контроль бюджета.",
      matchPercentage: Math.min(87, 70 + financeSkills.length * 5),
      averageSalary: experienceLevel === "senior" ? "280 000 - 500 000 ₸" : "150 000 - 280 000 ₸",
      demandLevel: "Средний",
      requiredSkills: ["Бухгалтерский учет", "Налогообложение", "1С", "Финансовый анализ"],
      growthProspects: "Стабильная профессия с постоянным спросом. Возможность работы в крупных компаниях и банках.",
      vacanciesCount: 400,
    })
  }

  // Ensure we have at least 3 professions with generic ones
  while (professions.length < 3) {
    const genericProfessions = [
      {
        title: "Специалист по продажам",
        description: "Развитие клиентской базы, ведение переговоров, достижение целей продаж, работа с CRM-системами.",
        skills: ["Продажи", "Переговоры", "CRM", "Клиентский сервис"],
        salary: "180 000 - 350 000 ₸",
        match: 72,
        demand: "Высокий",
        vacancies: 800,
      },
      {
        title: "Специалист по маркетингу",
        description:
          "Разработка маркетинговых стратегий, продвижение продуктов, анализ рынка, работа с социальными сетями.",
        skills: ["Маркетинг", "SMM", "Аналитика", "Контент-маркетинг"],
        salary: "200 000 - 400 000 ₸",
        match: 70,
        demand: "Средний",
        vacancies: 450,
      },
      {
        title: "Администратор",
        description: "Организационная работа, документооборот, координация деятельности офиса, работа с клиентами.",
        skills: ["Организация", "MS Office", "Коммуникация", "Документооборот"],
        salary: "120 000 - 220 000 ₸",
        match: 68,
        demand: "Средний",
        vacancies: 600,
      },
    ]

    const prof = genericProfessions[professions.length % genericProfessions.length]
    professions.push({
      id: professions.length + 1,
      title: prof.title,
      description: prof.description,
      matchPercentage: prof.match,
      averageSalary: prof.salary,
      demandLevel: prof.demand,
      requiredSkills: prof.skills,
      growthProspects: "Стабильные перспективы развития с возможностью карьерного роста в выбранной области.",
      vacanciesCount: prof.vacancies,
    })
  }

  return professions.slice(0, 5)
}
