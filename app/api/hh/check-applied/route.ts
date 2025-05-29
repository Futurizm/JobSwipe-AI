import { type NextRequest, NextResponse } from "next/server"
import { HH_CONFIG } from "@/lib/headhunter"

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { vacancyId, accessToken } = await request.json()

    // Validate required fields
    if (!vacancyId || !accessToken) {
      return NextResponse.json({ error: "Missing required fields: vacancyId or accessToken" }, { status: 400 })
    }

    // Get user negotiations (applications)
    const response = await fetch(`${HH_CONFIG.apiBaseUrl}/negotiations`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to get negotiations: ${response.statusText}` },
        { status: response.status },
      )
    }

    const negotiations = await response.json()
    const hasApplied = negotiations.items.some((negotiation: any) => negotiation.vacancy.id === vacancyId)

    return NextResponse.json({ hasApplied })
  } catch (error: any) {
    console.error("Server: Error in check-applied API route:", error)
    return NextResponse.json({ error: error.message || "Произошла ошибка при проверке отклика" }, { status: 500 })
  }
}
