// HeadHunter API integration

// OAuth configuration
export const HH_CONFIG = {
  clientId: "H0VJ3K42LT3N2ERNF62MBQ9OTHKLHD9U0RCQLCNCAM5AHF8B70T3HIV7VS6N2A16",
  clientSecret: "SKH7E7A6URGBJ2L73MU40NG2UG41M1EADGHT24H8OLC71H9NT0LNO6O2HUPQKD70",
  redirectUri: "https://27e9-5-76-160-2.ngrok-free.app/auth/callback",
  authUrl: "https://hh.ru/oauth/authorize",
  tokenUrl: "https://hh.ru/oauth/token",
  apiBaseUrl: "https://api.hh.ru",
}

// Types for HeadHunter API
export interface HHVacancy {
  id: string
  name: string
  employer: {
    id: string
    name: string
    logo_urls?: {
      original?: string
      "90"?: string
      "240"?: string
    }
  }
  salary?: {
    from?: number
    to?: number
    currency?: string
    gross?: boolean
  }
  area: {
    id: string
    name: string
  }
  published_at: string
  alternate_url: string
  snippet?: {
    requirement?: string
    responsibility?: string
  }
  schedule?: {
    id: string
    name: string
  }
  experience?: {
    id: string
    name: string
  }
  employment?: {
    id: string
    name: string
  }
  description?: string
  key_skills?: { name: string }[]
}

export interface HHVacanciesResponse {
  items: HHVacancy[]
  found: number
  pages: number
  per_page: number
  page: number
}

export interface HHTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
}

export interface HHNegotiationResponse {
  id: string
  state: {
    id: string
    name: string
  }
  created_at: string
  updated_at: string
  vacancy: {
    id: string
    name: string
  }
  resume: {
    id: string
    title: string
  }
}

// Generate OAuth authorization URL
export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: HH_CONFIG.clientId,
    redirect_uri: HH_CONFIG.redirectUri,
  })

  return `${HH_CONFIG.authUrl}?${params.toString()}`
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(code: string): Promise<HHTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: HH_CONFIG.clientId,
    client_secret: HH_CONFIG.clientSecret,
    redirect_uri: HH_CONFIG.redirectUri,
    code,
  })

  const response = await fetch(HH_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Failed to exchange code for token: ${errorData.error_description || response.statusText}`)
  }

  return response.json()
}

// Refresh access token
export async function refreshToken(refreshToken: string): Promise<HHTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: HH_CONFIG.clientId,
    client_secret: HH_CONFIG.clientSecret,
    refresh_token: refreshToken,
  })

  const response = await fetch(HH_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Failed to refresh token: ${errorData.error_description || response.statusText}`)
  }

  return response.json()
}

// Get user info
export async function getUserInfo(accessToken: string) {
  const response = await fetch(`${HH_CONFIG.apiBaseUrl}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`)
  }

  return response.json()
}

// Get vacancies
export async function getVacancies(
  accessToken: string,
  params: { text?: string; area?: string; per_page?: number; page?: number } = {},
): Promise<HHVacanciesResponse> {
  const searchParams = new URLSearchParams()

  if (params.text) searchParams.append("text", params.text)
  if (params.area) searchParams.append("area", params.area)
  if (params.per_page) searchParams.append("per_page", params.per_page.toString())
  if (params.page) searchParams.append("page", params.page.toString())

  const response = await fetch(`${HH_CONFIG.apiBaseUrl}/vacancies?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get vacancies: ${response.statusText}`)
  }

  return response.json()
}

// Get vacancy details
export async function getVacancyDetails(accessToken: string, vacancyId: string): Promise<HHVacancy> {
  const response = await fetch(`${HH_CONFIG.apiBaseUrl}/vacancies/${vacancyId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get vacancy details: ${response.statusText}`)
  }

  return response.json()
}

// Apply to vacancy - now uses our server-side API route
export async function applyToVacancy(
  accessToken: string,
  vacancyId: string,
  resumeId: string,
  message?: string,
): Promise<HHNegotiationResponse> {
  console.log(`Client: Attempting to apply to vacancy ${vacancyId} with resume ${resumeId}`)

  // Get the vacancy data for cover letter generation
  let vacancyData = null
  let coverLetter = message

  try {
    // Get vacancy details
    const vacancyDetails = await getVacancyDetails(accessToken, vacancyId)
    vacancyData = convertHHVacancyToJob(vacancyDetails)

    // Check if we have resume data stored
    const storedResumeData = localStorage.getItem("resumeData")

    if (storedResumeData && !message) {
      // Generate personalized cover letter
      const resumeData = JSON.parse(storedResumeData)

      const response = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeData,
          vacancyData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.coverLetter) {
          coverLetter = result.coverLetter
          console.log("Generated personalized cover letter")
        }
      }
    }
  } catch (error) {
    console.error("Error generating cover letter:", error)
    // Continue with default message if cover letter generation fails
  }

  // Call our server-side API route instead of directly calling HeadHunter API
  try {
    const response = await fetch("/api/hh/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken,
        vacancyId,
        resumeId,
        message: coverLetter,
      }),
    })

    console.log("Client: Response status:", response.status)

    const responseData = await response.json()

    if (!response.ok) {
      // Handle specific error cases more gracefully
      if (response.status === 403 || responseData.error?.includes("Доступ запрещен")) {
        console.log("Permission denied for vacancy application")
        // Still return a partial success to avoid blocking the UI
        return {
          status: "error",
          error: "permission_denied",
          message: responseData.error || "Доступ запрещен. Возможно, у вас нет прав для отклика на эту вакансию.",
        }
      }

      throw new Error(responseData.error || `Error applying to vacancy: ${response.statusText}`)
    }

    return responseData.data
  } catch (error: any) {
    console.error("Error in applyToVacancy:", error)
    throw error
  }
}

// Get user resumes
export async function getUserResumes(accessToken: string) {
  const response = await fetch(`${HH_CONFIG.apiBaseUrl}/resumes/mine`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get user resumes: ${response.statusText}`)
  }

  return response.json()
}

// Check if user has already applied to a vacancy - now uses our server-side API route
export async function hasAppliedToVacancy(accessToken: string, vacancyId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/hh/check-applied", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken,
        vacancyId,
      }),
    })

    if (!response.ok) {
      console.error("Error checking if already applied:", response.statusText)
      return false
    }

    const data = await response.json()
    return data.hasApplied
  } catch (error) {
    console.error("Error checking if already applied:", error)
    return false
  }
}

// Store token in localStorage
export function storeToken(tokenData: HHTokenResponse) {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "hh_token",
      JSON.stringify({
        ...tokenData,
        expires_at: Date.now() + tokenData.expires_in * 1000,
      }),
    )
  }
}

// Get token from localStorage
export function getStoredToken(): (HHTokenResponse & { expires_at: number }) | null {
  if (typeof window !== "undefined") {
    const tokenData = localStorage.getItem("hh_token")
    if (tokenData) {
      return JSON.parse(tokenData)
    }
  }
  return null
}

// Check if token is valid
export function isTokenValid(): boolean {
  const tokenData = getStoredToken()
  if (!tokenData) return false

  // Check if token is expired (with 5 minute buffer)
  return tokenData.expires_at > Date.now() + 5 * 60 * 1000
}

// Clear token from localStorage
export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("hh_token")
  }
}

// Format salary
export function formatSalary(salary?: { from?: number; to?: number; currency?: string }): string {
  if (!salary) return "Зарплата не указана"

  const currency = salary.currency === "RUR" ? "₽" : salary.currency

  if (salary.from && salary.to) {
    return `${salary.from.toLocaleString()} - ${salary.to.toLocaleString()} ${currency}`
  } else if (salary.from) {
    return `от ${salary.from.toLocaleString()} ${currency}`
  } else if (salary.to) {
    return `до ${salary.to.toLocaleString()} ${currency}`
  }

  return "Зарплата не указана"
}

// Convert HH vacancy to app job format
export function convertHHVacancyToJob(vacancy: HHVacancy) {
  // Safely extract skills from requirement or key_skills
  const skills = vacancy.key_skills
    ? vacancy.key_skills.map((skill) => skill.name)
    : vacancy.snippet?.requirement
      ? vacancy.snippet.requirement
          .split(/[,;.]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.length < 30)
          .slice(0, 5)
      : []

  // Safely extract description from snippet or description field
  const description =
    vacancy.snippet?.responsibility ||
    vacancy.description ||
    vacancy.snippet?.requirement ||
    "Описание вакансии не предоставлено"

  return {
    id: vacancy.id,
    title: vacancy.name,
    company: vacancy.employer.name,
    location: vacancy.area.name,
    salary: formatSalary(vacancy.salary),
    description: description,
    requirements: skills,
    matchPercentage: Math.floor(Math.random() * 20) + 75, // Random match between 75-95%
    logo: vacancy.employer.logo_urls?.["90"] || "/placeholder.svg?height=80&width=80",
    type: vacancy.employment?.name || "Полная занятость",
    experience: vacancy.experience?.name || "Не указан",
    companyDescription: `${vacancy.employer.name} — компания, предлагающая интересные возможности для профессионального роста.`,
    benefits: ["Профессиональное развитие", "Дружный коллектив", "Современный офис", "Гибкий график"],
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
    alternate_url: vacancy.alternate_url,
  }
}
