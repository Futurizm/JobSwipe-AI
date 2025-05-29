// Application management utilities

export interface JobApplication {
  id: string
  vacancyId: string
  title: string
  company: string
  logo?: string
  status: "sent" | "viewed" | "interview" | "rejected" | "accepted"
  appliedAt: string
  updatedAt: string
  salary?: string
  location?: string
  description?: string
  coverLetter?: string
}

export const APPLICATION_STATUSES = {
  sent: {
    label: "Отклик отправлен",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  viewed: {
    label: "Просмотрено",
    color: "bg-gray-500",
    textColor: "text-gray-500",
    bgColor: "bg-gray-50",
  },
  interview: {
    label: "Приглашение на собеседование",
    color: "bg-success-500",
    textColor: "text-success-500",
    bgColor: "bg-success-50",
  },
  rejected: {
    label: "Отказ",
    color: "bg-destructive",
    textColor: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  accepted: {
    label: "Принят",
    color: "bg-green-600",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
  },
}

// Save application to localStorage
export function saveApplication(application: Omit<JobApplication, "id" | "appliedAt" | "updatedAt">): JobApplication {
  const applications = getApplications()

  const newApplication: JobApplication = {
    ...application,
    id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "sent",
  }

  // Check if application already exists for this vacancy
  const existingIndex = applications.findIndex((app) => app.vacancyId === application.vacancyId)

  if (existingIndex >= 0) {
    // Update existing application
    applications[existingIndex] = {
      ...applications[existingIndex],
      ...newApplication,
      id: applications[existingIndex].id,
    }
    localStorage.setItem("job_applications", JSON.stringify(applications))
    return applications[existingIndex]
  } else {
    // Add new application
    applications.unshift(newApplication) // Add to beginning for chronological order
    localStorage.setItem("job_applications", JSON.stringify(applications))
    return newApplication
  }
}

// Get all applications from localStorage
export function getApplications(): JobApplication[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem("job_applications")
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error loading applications:", error)
    return []
  }
}

// Update application status
export function updateApplicationStatus(applicationId: string, status: JobApplication["status"]): void {
  const applications = getApplications()
  const index = applications.findIndex((app) => app.id === applicationId)

  if (index >= 0) {
    applications[index].status = status
    applications[index].updatedAt = new Date().toISOString()
    localStorage.setItem("job_applications", JSON.stringify(applications))
  }
}

// Check if user has applied to a vacancy
export function hasAppliedToVacancyLocal(vacancyId: string): boolean {
  const applications = getApplications()
  return applications.some((app) => app.vacancyId === vacancyId)
}

// Get application by vacancy ID
export function getApplicationByVacancyId(vacancyId: string): JobApplication | null {
  const applications = getApplications()
  return applications.find((app) => app.vacancyId === vacancyId) || null
}

// Delete application
export function deleteApplication(applicationId: string): void {
  const applications = getApplications()
  const filtered = applications.filter((app) => app.id !== applicationId)
  localStorage.setItem("job_applications", JSON.stringify(filtered))
}

// Get applications with pagination
export function getApplicationsPaginated(page = 1, limit = 10) {
  const applications = getApplications()
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit

  return {
    applications: applications.slice(startIndex, endIndex),
    total: applications.length,
    hasMore: endIndex < applications.length,
    currentPage: page,
    totalPages: Math.ceil(applications.length / limit),
  }
}

// Format date for display
export function formatApplicationDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Get applications grouped by status
export function getApplicationsByStatus() {
  const applications = getApplications()

  return {
    interview: applications.filter((app) => app.status === "interview"),
    viewed: applications.filter((app) => app.status === "viewed"),
    sent: applications.filter((app) => app.status === "sent"),
    rejected: applications.filter((app) => app.status === "rejected"),
    accepted: applications.filter((app) => app.status === "accepted"),
  }
}
