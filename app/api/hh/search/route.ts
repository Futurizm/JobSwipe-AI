import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const params = await request.json()

    // Строим URL для API HeadHunter
    const searchParams = new URLSearchParams()

    // Добавляем параметры только если они не пустые
    if (params.text && params.text.trim()) {
      searchParams.append("text", params.text.trim())
    }

    // Для области используем ID, а не название
    if (params.area && params.area.trim()) {
      // Простое сопоставление городов с их ID в HH API
      const areaMap: { [key: string]: string } = {
        москва: "1",
        "санкт-петербург": "2",
        спб: "2",
        екатеринбург: "3",
        новосибирск: "4",
        "нижний новгород": "5",
        казань: "88",
        челябинск: "89",
        омск: "90",
        самара: "91",
        "ростов-на-дону": "92",
        уфа: "93",
        красноярск: "94",
        воронеж: "95",
        пермь: "96",
        волгоград: "97",
      }

      const areaLower = params.area.toLowerCase().trim()
      const areaId = areaMap[areaLower] || "113" // 113 - Россия
      searchParams.append("area", areaId)
    } else {
      // По умолчанию ищем по всей России
      searchParams.append("area", "113")
    }

    if (params.experience && params.experience.trim()) {
      searchParams.append("experience", params.experience)
    }

    if (params.employment && params.employment.trim()) {
      searchParams.append("employment", params.employment)
    }

    if (params.schedule && params.schedule.trim()) {
      searchParams.append("schedule", params.schedule)
    }

    // Для зарплаты используем правильный формат
    if (params.salary_from && !isNaN(params.salary_from)) {
      searchParams.append("salary", params.salary_from.toString())
    }

    // Пагинация
    const page = Math.max(0, Number.parseInt(params.page) || 0)
    const perPage = Math.min(100, Math.max(1, Number.parseInt(params.per_page) || 20))

    searchParams.append("page", page.toString())
    searchParams.append("per_page", perPage.toString())
    searchParams.append("order_by", "publication_time")

    console.log("HH API request URL:", `https://api.hh.ru/vacancies?${searchParams.toString()}`)

    const response = await fetch(`https://api.hh.ru/vacancies?${searchParams.toString()}`, {
      headers: {
        "User-Agent": "JobFinder/1.0 (contact@example.com)",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("HH API error response:", errorText)
      throw new Error(`HH API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error searching vacancies:", error)

    // Возвращаем fallback данные в случае ошибки
    const fallbackData = {
      items: [
        {
          id: "fallback_1",
          name: "Frontend Developer",
          employer: {
            name: "TechCorp",
            logo_urls: {
              "90": "/placeholder.svg?height=90&width=90",
            },
          },
          area: {
            name: "Москва",
          },
          salary: {
            from: 150000,
            to: 250000,
            currency: "RUR",
          },
          snippet: {
            requirement: "Опыт работы с React, TypeScript, знание современных инструментов разработки",
            responsibility: "Разработка пользовательских интерфейсов, оптимизация производительности",
          },
          schedule: {
            name: "Полный день",
          },
          employment: {
            name: "Полная занятость",
          },
          experience: {
            name: "От 1 года до 3 лет",
          },
          published_at: new Date().toISOString(),
          alternate_url: "https://hh.ru/vacancy/fallback_1",
          relevanceScore: 92,
        },
        {
          id: "fallback_2",
          name: "React Developer",
          employer: {
            name: "WebStudio",
            logo_urls: {
              "90": "/placeholder.svg?height=90&width=90",
            },
          },
          area: {
            name: "Санкт-Петербург",
          },
          salary: {
            from: 120000,
            to: 200000,
            currency: "RUR",
          },
          snippet: {
            requirement: "React, Redux, JavaScript ES6+, опыт работы с REST API",
            responsibility: "Создание компонентов, интеграция с backend, code review",
          },
          schedule: {
            name: "Гибкий график",
          },
          employment: {
            name: "Полная занятость",
          },
          experience: {
            name: "От 1 года до 3 лет",
          },
          published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          alternate_url: "https://hh.ru/vacancy/fallback_2",
          relevanceScore: 88,
        },
      ],
      found: 2,
      pages: 1,
      page: 0,
      per_page: 20,
    }

    return NextResponse.json(fallbackData)
  }
}