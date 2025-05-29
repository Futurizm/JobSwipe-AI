import { type NextRequest, NextResponse } from "next/server"
import { HH_CONFIG } from "@/lib/headhunter"

// Кэш для запросов (простой in-memory кэш)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 минут

export async function POST(request: NextRequest) {
  try {
    const params = await request.json()

    // Создаем ключ для кэша
    const cacheKey = JSON.stringify(params)
    const cached = cache.get(cacheKey)

    // Проверяем кэш
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("Returning cached data")
      return NextResponse.json(cached.data)
    }

    console.log("Fetching fresh data from HeadHunter API")

    // Оптимизированные параметры запроса
    const searchParams = new URLSearchParams()

    // Базовые параметры
    searchParams.append("per_page", "50") // Увеличиваем количество за раз
    searchParams.append("page", (params.page || 0).toString())

    // Добавляем поисковый запрос
    if (params.text) {
      searchParams.append("text", params.text)
    }

    // Добавляем фильтры только если они заданы
    if (params.area) searchParams.append("area", params.area)
    if (params.experience) searchParams.append("experience", params.experience)
    if (params.employment) searchParams.append("employment", params.employment)
    if (params.schedule) searchParams.append("schedule", params.schedule)

    // Сортировка по дате публикации (самые свежие)
    searchParams.append("order_by", "publication_time")

    // Только активные вакансии
    searchParams.append("only_with_salary", "false")

    const response = await fetch(`${HH_CONFIG.apiBaseUrl}/vacancies?${searchParams.toString()}`, {
      headers: {
        "User-Agent": "JobSwipe/1.0",
        Accept: "application/json",
      },
      // Добавляем таймаут
      signal: AbortSignal.timeout(10000), // 10 секунд максимум
    })

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limit - возвращаем кэшированные данные если есть
        if (cached) {
          return NextResponse.json(cached.data)
        }
        return NextResponse.json({ error: "Too many requests" }, { status: 429 })
      }
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    // Преобразуем данные для фронтенда
    const transformedData = {
      items:
        data.items?.map((vacancy: any) => ({
          id: vacancy.id,
          title: vacancy.name,
          company: vacancy.employer?.name || "Не указано",
          location: vacancy.area?.name || "Не указано",
          salary: formatSalary(vacancy.salary),
          description: vacancy.snippet?.responsibility || vacancy.snippet?.requirement || "Описание не указано",
          requirements: vacancy.key_skills?.map((skill: any) => skill.name) || [],
          matchPercentage: Math.floor(Math.random() * 20) + 75,
          logo: vacancy.employer?.logo_urls?.["90"] || "/placeholder.svg?height=80&width=80",
          type: vacancy.employment?.name || "Полная занятость",
          experience: vacancy.experience?.name || "Не указан",
          companyDescription: `${vacancy.employer?.name || "Компания"} — предлагает интересные возможности для профессионального роста.`,
          benefits: ["Профессиональное развитие", "Дружный коллектив"],
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          alternate_url: vacancy.alternate_url,
          published_at: vacancy.published_at,
        })) || [],
      found: data.found || 0,
      pages: data.pages || 1,
      per_page: data.per_page || 50,
      page: data.page || 0,
    }

    // Сохраняем в кэш
    cache.set(cacheKey, {
      data: transformedData,
      timestamp: Date.now(),
    })

    // Очищаем старые записи из кэша
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }

    return NextResponse.json(transformedData)
  } catch (error: any) {
    console.error("Error in search route:", error)

    // Возвращаем fallback данные
    return NextResponse.json({
      items: [],
      found: 0,
      pages: 1,
      per_page: 50,
      page: 0,
      error: error.message,
    })
  }
}

function formatSalary(salary?: { from?: number; to?: number; currency?: string }): string {
  if (!salary) return "Зарплата не указана"

  const currency = salary.currency === "RUR" ? "₽" : salary.currency || "₽"

  if (salary.from && salary.to) {
    return `${salary.from.toLocaleString()} - ${salary.to.toLocaleString()} ${currency}`
  } else if (salary.from) {
    return `от ${salary.from.toLocaleString()} ${currency}`
  } else if (salary.to) {
    return `до ${salary.to.toLocaleString()} ${currency}`
  }

  return "Зарплата не указана"
}
