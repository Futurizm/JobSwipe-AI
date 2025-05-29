import { type NextRequest, NextResponse } from "next/server"
import { HH_CONFIG } from "@/lib/headhunter"

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { vacancyId, resumeId, accessToken, message } = await request.json()

    // Validate required fields
    if (!vacancyId || !resumeId || !accessToken) {
      return NextResponse.json(
        { error: "Missing required fields: vacancyId, resumeId, or accessToken" },
        { status: 400 },
      )
    }

    console.log(`Server: Attempting to apply to vacancy ${vacancyId} with resume ${resumeId}`)

    // HeadHunter API expects form data, not JSON
    const formData = new FormData()
    formData.append("vacancy_id", vacancyId)
    formData.append("resume_id", resumeId)
    formData.append(
      "message",
      message || "Здравствуйте! Меня заинтересовала ваша вакансия. Буду рад обсудить возможности сотрудничества.",
    )

    console.log("Server: Applying with form data:", {
      vacancy_id: vacancyId,
      resume_id: resumeId,
      message: message || "Default message",
    })

    // Make the request to HeadHunter API using form data
    const response = await fetch(`${HH_CONFIG.apiBaseUrl}/negotiations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "JobSwipe/1.0",
        Accept: "application/json",
        // Don't set Content-Type when using FormData - let the browser set it
      },
      body: formData,
    })

    console.log("Server: Response status:", response.status)

    // Get response as text first
    const responseText = await response.text()
    console.log("Server: Raw response:", responseText)

    // Parse response if not empty
    let responseData
    try {
      responseData = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      console.error("Server: Failed to parse response as JSON:", e)
      responseData = {}
    }

    // Handle error responses
    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 403) {
        return NextResponse.json(
          { error: "Доступ запрещен. Возможно, у вас нет прав для отклика на эту вакансию." },
          { status: 403 },
        )
      }

      if (response.status === 400) {
        // Try to extract specific error messages
        if (responseData.errors && Array.isArray(responseData.errors)) {
          const errorMessages = responseData.errors.map((error: any) => {
            // Handle specific error types
            if (error.type === "already_applied") {
              return "Вы уже откликались на эту вакансию"
            }
            if (error.type === "resume_not_found") {
              return "Резюме не найдено или не опубликовано"
            }
            if (error.type === "vacancy_not_found") {
              return "Вакансия не найдена или недоступна для отклика"
            }
            if (error.type === "limit_exceeded") {
              return "Превышен лимит откликов"
            }
            if (error.type === "bad_argument") {
              return `Неверный параметр: ${error.value}`
            }

            return error.value || error.type || "Неизвестная ошибка"
          })
          return NextResponse.json({ error: errorMessages.join(", ") }, { status: 400 })
        }

        // If we have a description, use it
        if (responseData.description) {
          return NextResponse.json({ error: responseData.description }, { status: 400 })
        }

        // Generic error for bad requests
        return NextResponse.json(
          { error: "Ошибка при отправке отклика. Проверьте данные и попробуйте снова." },
          { status: 400 },
        )
      }

      // Generic error for other status codes
      return NextResponse.json(
        { error: `Ошибка сервера (${response.status}): Попробуйте позже` },
        { status: response.status },
      )
    }

    // Success response
    return NextResponse.json({ success: true, data: responseData })
  } catch (error: any) {
    console.error("Server: Error in apply API route:", error)
    return NextResponse.json({ error: error.message || "Произошла ошибка при отправке отклика" }, { status: 500 })
  }
}
