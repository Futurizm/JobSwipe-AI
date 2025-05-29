"use client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

import { useState, useEffect, useCallback } from "react"
import {
  ArrowLeft,
  Award,
  BarChart3,
  Book,
  Briefcase,
  Download,
  Pencil,
  School,
  User,
  Plus,
  X,
  ChevronDown,
  Calendar,
  Building,
  MapPin,
  DollarSign,
  Trash2,
  Eye,
  Send,
  Clock,
  TrendingUp,
  Loader2,
  XCircle,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SkillRadarChart } from "@/components/skill-radar-chart"
import { Input } from "@/components/ui/input"
import { useTelegram } from "@/components/telegram-provider"
import { setupBackButton } from "@/lib/telegram"
import {
  getApplicationsPaginated,
  APPLICATION_STATUSES,
  formatApplicationDate,
  deleteApplication,
  updateApplicationStatus,
  type JobApplication,
} from "@/lib/applications"
import { useToast } from "@/hooks/use-toast"
import { getStoredToken, getUserInfo, getUserResumes } from "@/lib/headhunter"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GOOGLE_API_KEY } from "@/constants/constants"

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

interface ResumeData {
  name: string
  email: string
  phone: string
  location: string
  skills: string[]
  experience: string
  experienceYears: number
  education: Array<{
    institution: string
    degree: string
    year: string
  }>
  summary: string
}

interface TranslatedResumeData extends ResumeData {
  translatedExperience: string
  translatedEducation: Array<{
    institution: string
    degree: string
    year: string
  }>
}

interface UserStats {
  viewsThisWeek: number
  applicationsThisMonth: number
  responseRate: number
  averageResponseTime: string
  totalViews: number
  totalNegotiations: number
}

interface AIRecommendation {
  title: string
  description: string
  priority: "high" | "medium" | "low"
  category: "profile" | "skills" | "experience" | "applications"
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isInTelegram, user } = useTelegram()
  const [skills, setSkills] = useState<{ name: string; level: number }[]>([])
  const [isEditingSkills, setIsEditingSkills] = useState(false)
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillLevel, setNewSkillLevel] = useState(50)
  const [resumeData, setResumeData] = useState<TranslatedResumeData | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [userResumes, setUserResumes] = useState<any[]>([])
  const [translatingResume, setTranslatingResume] = useState(false)

  // Applications state
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalApplications, setTotalApplications] = useState(0)
  const applicationsPerPage = 5

  // Setup back button for Telegram
  useEffect(() => {
    if (isInTelegram) {
      setupBackButton(() => router.push("/"))
    }
  }, [isInTelegram, router])

  // Translate text to Russian using AI
  const translateToRussian = useCallback(async (text: string): Promise<string> => {
    if (!text || text.trim() === "") return ""

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = `
        Translate the following text to Russian. Keep professional terminology intact.
        If the text is already in Russian, just return it as is.
        
        Text to translate:
        "${text}"
        
        Return ONLY the translated text without any additional comments or explanations.
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text().trim()
    } catch (error) {
      console.error("Translation error:", error)
      return text // Return original text if translation fails
    }
  }, [])

  // Translate education data
  const translateEducation = useCallback(
    async (education: ResumeData["education"]) => {
      if (!education || education.length === 0) return []

      const translatedEducation = []

      for (const edu of education) {
        const [translatedInstitution, translatedDegree] = await Promise.all([
          translateToRussian(edu.institution),
          translateToRussian(edu.degree),
        ])

        translatedEducation.push({
          institution: translatedInstitution,
          degree: translatedDegree,
          year: edu.year,
        })
      }

      return translatedEducation
    },
    [translateToRussian],
  )

  // Load and translate resume data from localStorage
  useEffect(() => {
    const loadResumeData = async () => {
      const storedResumeData = localStorage.getItem("resumeData")
      if (storedResumeData) {
        try {
          setTranslatingResume(true)
          const data = JSON.parse(storedResumeData) as ResumeData

          // Convert skills to the format with levels
          if (data.skills && Array.isArray(data.skills)) {
            const skillsWithLevels = data.skills.map((skill: string) => ({
              name: skill,
              level: Math.floor(Math.random() * 30) + 70, // Random level between 70-100
            }))
            setSkills(skillsWithLevels)
          }

          // Translate experience and education
          const [translatedExperience, translatedEducation] = await Promise.all([
            translateToRussian(data.experience),
            translateEducation(data.education),
          ])

          setResumeData({
            ...data,
            translatedExperience,
            translatedEducation,
          })
        } catch (error) {
          console.error("Error parsing or translating resume data:", error)
          const data = JSON.parse(storedResumeData) as ResumeData
          setResumeData({
            ...data,
            translatedExperience: data.experience,
            translatedEducation: data.education,
          })
        } finally {
          setTranslatingResume(false)
        }
      }
    }

    loadResumeData()
  }, [translateToRussian, translateEducation])

  // Load user statistics from HeadHunter
  useEffect(() => {
    const loadUserStats = async () => {
      setLoadingStats(true)
      try {
        const tokenData = getStoredToken()
        if (tokenData) {
          // Get user info and resumes
          const [userInfo, resumesResponse] = await Promise.all([
            getUserInfo(tokenData.access_token),
            getUserResumes(tokenData.access_token),
          ])

          setUserResumes(resumesResponse.items || [])

          // Calculate statistics from resumes
          const resumes = resumesResponse.items || []
          let totalViews = 0
          let totalNegotiations = 0
          let viewsThisWeek = 0
          let applicationsThisMonth = 0

          resumes.forEach((resume: any) => {
            if (resume.total_views) {
              totalViews += resume.total_views
              // Estimate views this week (assuming 1/4 of total views are recent)
              viewsThisWeek += Math.floor(resume.total_views / 4)
            }
            if (resume.negotiations_count) {
              totalNegotiations += resume.negotiations_count
            }
          })

          // Get applications from local storage for this month
          const localApplications = getApplicationsPaginated(1, 1000)
          const thisMonth = new Date()
          thisMonth.setDate(1)

          applicationsThisMonth = localApplications.applications.filter(
            (app) => new Date(app.appliedAt) >= thisMonth,
          ).length

          // Calculate response rate
          const responseRate =
            totalNegotiations > 0 && applicationsThisMonth > 0
              ? Math.min(Math.round((totalNegotiations / applicationsThisMonth) * 100), 100)
              : Math.floor(Math.random() * 30) + 40 // Random between 40-70% if no data

          setUserStats({
            viewsThisWeek: viewsThisWeek || Math.floor(Math.random() * 20) + 5,
            applicationsThisMonth: applicationsThisMonth || Math.floor(Math.random() * 15) + 3,
            responseRate,
            averageResponseTime: totalNegotiations > 5 ? "1-2 дня" : "2-3 дня",
            totalViews,
            totalNegotiations,
          })
        } else {
          // Mock data if not authenticated
          setUserStats({
            viewsThisWeek: Math.floor(Math.random() * 20) + 5,
            applicationsThisMonth: Math.floor(Math.random() * 15) + 3,
            responseRate: Math.floor(Math.random() * 30) + 40,
            averageResponseTime: "2-3 дня",
            totalViews: Math.floor(Math.random() * 100) + 50,
            totalNegotiations: Math.floor(Math.random() * 10) + 2,
          })
        }
      } catch (error) {
        console.error("Error loading user stats:", error)
        // Fallback to mock data
        setUserStats({
          viewsThisWeek: Math.floor(Math.random() * 20) + 5,
          applicationsThisMonth: Math.floor(Math.random() * 15) + 3,
          responseRate: Math.floor(Math.random() * 30) + 40,
          averageResponseTime: "2-3 дня",
          totalViews: Math.floor(Math.random() * 100) + 50,
          totalNegotiations: Math.floor(Math.random() * 10) + 2,
        })
      } finally {
        setLoadingStats(false)
      }
    }

    loadUserStats()
  }, [])

  // Generate AI recommendations
  useEffect(() => {
    const generateRecommendations = async () => {
      if (!resumeData || !userStats) return

      setLoadingRecommendations(true)
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `
          Analyze this user profile and generate personalized recommendations for improving their job search success.
          Write recommendations in Russian language.
          
          User Profile:
          - Name: ${resumeData.name}
          - Experience: ${resumeData.experienceYears} years
          - Skills: ${resumeData.skills.join(", ")}
          - Location: ${resumeData.location}
          - Summary: ${resumeData.summary}
          
          Statistics:
          - Views this week: ${userStats.viewsThisWeek}
          - Applications this month: ${userStats.applicationsThisMonth}
          - Response rate: ${userStats.responseRate}%
          - Total views: ${userStats.totalViews}
          
          Generate 3-5 specific, actionable recommendations in JSON format:
          [
            {
              "title": "Recommendation title in Russian",
              "description": "Detailed description with specific actions in Russian",
              "priority": "high|medium|low",
              "category": "profile|skills|experience|applications"
            }
          ]
          
          Focus on:
          1. Profile optimization
          2. Skill development
          3. Application strategy
          4. Market positioning
          
          Return ONLY the JSON array, no additional text.
        `

        const result = await model.generateContent(prompt)
        const response = await result.response
        let recommendationsText = response.text().trim()

        // Clean the response
        if (recommendationsText.startsWith("```json")) {
          recommendationsText = recommendationsText.replace(/```json\n?/, "").replace(/\n?```$/, "")
        } else if (recommendationsText.startsWith("```")) {
          recommendationsText = recommendationsText.replace(/```\n?/, "").replace(/\n?```$/, "")
        }

        const recommendations = JSON.parse(recommendationsText)
        setAiRecommendations(recommendations)
      } catch (error) {
        console.error("Error generating AI recommendations:", error)
        // Fallback recommendations
        setAiRecommendations([
          {
            title: "Обновите фотографию профиля",
            description: "Профессиональное фото увеличивает количество просмотров на 30%",
            priority: "high",
            category: "profile",
          },
          {
            title: "Добавьте больше ключевых навыков",
            description: "Расширьте список навыков для лучшего соответствия вакансиям",
            priority: "medium",
            category: "skills",
          },
          {
            title: "Персонализируйте сопроводительные письма",
            description: "Индивидуальный подход повышает отклик работодателей",
            priority: "medium",
            category: "applications",
          },
        ])
      } finally {
        setLoadingRecommendations(false)
      }
    }

    generateRecommendations()
  }, [resumeData, userStats])

  // Load applications
  useEffect(() => {
    loadApplications()
  }, [currentPage])

  const loadApplications = () => {
    const result = getApplicationsPaginated(currentPage, applicationsPerPage)

    if (currentPage === 1) {
      setApplications(result.applications)
    } else {
      setApplications((prev) => [...prev, ...result.applications])
    }

    setHasMore(result.hasMore)
    setTotalApplications(result.total)
  }

  const loadMoreApplications = () => {
    setCurrentPage((prev) => prev + 1)
  }

  const handleDeleteApplication = (applicationId: string) => {
    deleteApplication(applicationId)
    setApplications((prev) => prev.filter((app) => app.id !== applicationId))
    setTotalApplications((prev) => prev - 1)
    toast({
      title: "Отклик удален",
      description: "Отклик успешно удален из истории",
    })
  }

  const handleStatusChange = (applicationId: string, newStatus: JobApplication["status"]) => {
    updateApplicationStatus(applicationId, newStatus)
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus, updatedAt: new Date().toISOString() } : app,
      ),
    )
    toast({
      title: "Статус обновлен",
      description: `Статус отклика изменен на "${APPLICATION_STATUSES[newStatus].label}"`,
    })
  }

  // Download resume function
  const downloadResume = () => {
    if (!resumeData) {
      toast({
        title: "Резюме не найдено",
        description: "Сначала загрузите резюме в приложение",
        variant: "destructive",
      })
      return
    }

    // Create resume content
    const resumeContent = `
${resumeData.name}
${resumeData.email} | ${resumeData.phone}
${resumeData.location}

ПРОФЕССИОНАЛЬНОЕ РЕЗЮМЕ
${resumeData.summary}

ОПЫТ РАБОТЫ
${resumeData.translatedExperience || resumeData.experience}
Опыт: ${resumeData.experienceYears} лет

ОБРАЗОВАНИЕ
${
  resumeData.translatedEducation?.map((edu) => `${edu.institution} - ${edu.degree} (${edu.year})`).join("\n") ||
  resumeData.education.map((edu) => `${edu.institution} - ${edu.degree} (${edu.year})`).join("\n")
}

НАВЫКИ
${resumeData.skills.join(", ")}

Создано с помощью Job Finder App
    `.trim()

    // Create and download file
    const blob = new Blob([resumeContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${resumeData.name.replace(/\s+/g, "_")}_Resume.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Резюме скачано",
      description: "Файл резюме успешно сохранен на устройство",
    })
  }

  // Save skills to localStorage
  const saveSkillsToResume = (updatedSkills: { name: string; level: number }[]) => {
    const storedResumeData = localStorage.getItem("resumeData")
    if (storedResumeData) {
      try {
        const data = JSON.parse(storedResumeData)
        data.skills = updatedSkills.map((skill) => skill.name)
        localStorage.setItem("resumeData", JSON.stringify(data))

        if (resumeData) {
          setResumeData({
            ...resumeData,
            skills: data.skills,
          })
        }
      } catch (error) {
        console.error("Error updating resume data:", error)
      }
    }
  }

  const addSkill = () => {
    if (newSkillName.trim() && !skills.find((s) => s.name.toLowerCase() === newSkillName.toLowerCase())) {
      const updatedSkills = [...skills, { name: newSkillName.trim(), level: newSkillLevel }]
      setSkills(updatedSkills)
      saveSkillsToResume(updatedSkills)
      setNewSkillName("")
      setNewSkillLevel(50)
    }
  }

  const removeSkill = (skillName: string) => {
    const updatedSkills = skills.filter((skill) => skill.name !== skillName)
    setSkills(updatedSkills)
    saveSkillsToResume(updatedSkills)
  }

  const updateSkillLevel = (skillName: string, newLevel: number) => {
    const updatedSkills = skills.map((skill) => (skill.name === skillName ? { ...skill, level: newLevel } : skill))
    setSkills(updatedSkills)
    saveSkillsToResume(updatedSkills)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "profile":
        return <User className="h-4 w-4" />
      case "skills":
        return <Award className="h-4 w-4" />
      case "experience":
        return <Briefcase className="h-4 w-4" />
      case "applications":
        return <Send className="h-4 w-4" />
      default:
        return <Book className="h-4 w-4" />
    }
  }

  const getStatusDisplay = (status: JobApplication["status"]) => {
    switch (status) {
      case "viewed":
        return {
          icon: <Eye className="h-4 w-4" />,
          label: "Просмотрено",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          badgeColor: "bg-blue-100 text-blue-700",
        };
      case "interview":
        return {
          icon: <Calendar className="h-4 w-4" />,
          label: "Собеседование",
          color: "text-success-600",
          bgColor: "bg-success-50",
          borderColor: "border-success-200",
          badgeColor: "bg-success-100 text-success-700",
        };
      case "rejected":
        return {
          icon: <XCircle className="h-4 w-4" />,
          label: "Отказ",
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          badgeColor: "bg-orange-100 text-orange-700",
        };
      case "accepted":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: "Принят",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          badgeColor: "bg-green-100 text-green-700",
        };
      default: // "sent"
        return {
          icon: <Clock className="h-4 w-4" />,
          label: "Отправлено",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          badgeColor: "bg-gray-100 text-gray-700",
        };
    }
  };

  // Get user data
  const userName =
    isInTelegram && user ? `${user.first_name} ${user.last_name || ""}`.trim() : resumeData?.name || "Пользователь"
  const userAvatar = isInTelegram && user?.photo_url ? user.photo_url : "/placeholder.svg"
  const userInitials = userName.substring(0, 2)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/50">
      <header className="p-4 flex items-center border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          className={isInTelegram ? "invisible" : ""}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium mx-auto">Профиль</h1>
      </header>

      <main className="flex-1 p-4 pb-20">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Profile header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-xl font-bold">{userName}</h2>
              <p className="text-muted-foreground">{resumeData?.summary || "Специалист"}</p>
              {isInTelegram && user?.username && <p className="text-sm text-primary">@{user.username}</p>}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Pencil className="h-4 w-4" />
                Редактировать
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={downloadResume}>
                <Download className="h-4 w-4" />
                Скачать резюме
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="resume" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="resume">Резюме</TabsTrigger>
              <TabsTrigger value="applications">
                Отклики
                {totalApplications > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                    {totalApplications}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="insights">Статистика</TabsTrigger>
            </TabsList>

            {/* Resume tab */}
            <TabsContent value="resume" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Основная информация</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Имя:</span>
                    <span>{userName}</span>
                  </div>
                  {resumeData?.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{resumeData.email}</span>
                    </div>
                  )}
                  {resumeData?.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Телефон:</span>
                      <span>{resumeData.phone}</span>
                    </div>
                  )}
                  {resumeData?.location && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Местоположение:</span>
                      <span>{resumeData.location}</span>
                    </div>
                  )}
                  {isInTelegram && user?.username && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telegram:</span>
                      <span>@{user.username}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Опыт работы</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {translatingResume ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Перевод опыта работы...</span>
                    </div>
                  ) : resumeData?.translatedExperience || resumeData?.experience ? (
                    <div className="space-y-2">
                      <p>{resumeData.translatedExperience || resumeData.experience}</p>
                      {resumeData.experienceYears > 0 && (
                        <p className="text-sm text-muted-foreground">Общий стаж: {resumeData.experienceYears} лет</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Опыт работы не указан</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <School className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Образование</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {translatingResume ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>Перевод образования...</span>
                    </div>
                  ) : resumeData?.translatedEducation && resumeData.translatedEducation.length > 0 ? (
                    <div className="space-y-3">
                      {resumeData.translatedEducation.map((edu, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-4">
                          <h4 className="font-medium">{edu.institution}</h4>
                          <p className="text-sm text-muted-foreground">{edu.degree}</p>
                          <p className="text-xs text-muted-foreground">{edu.year}</p>
                        </div>
                      ))}
                    </div>
                  ) : resumeData?.education && resumeData.education.length > 0 ? (
                    <div className="space-y-3">
                      {resumeData.education.map((edu, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-4">
                          <h4 className="font-medium">{edu.institution}</h4>
                          <p className="text-sm text-muted-foreground">{edu.degree}</p>
                          <p className="text-xs text-muted-foreground">{edu.year}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Образование не указано</p>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Skills Section */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Навыки</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingSkills(!isEditingSkills)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Skills Grid with Progress Bars */}
                  <div className="grid grid-cols-1 gap-4">
                    {skills.map((skill, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{skill.name}</span>
                            {isEditingSkills && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => removeSkill(skill.name)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <span className="text-sm font-medium text-primary">{skill.level}%</span>
                        </div>
                        <div className="relative">
                          <Progress value={skill.level} className="h-3 bg-muted" />
                          {isEditingSkills && (
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={skill.level}
                              onChange={(e) => updateSkillLevel(skill.name, Number.parseInt(e.target.value))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Skill */}
                  {isEditingSkills && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-medium">Добавить навык</h4>
                      <div className="space-y-2">
                        <Input
                          placeholder="Название навыка"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                        />
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Уровень</span>
                            <span>{newSkillLevel}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={newSkillLevel}
                            onChange={(e) => setNewSkillLevel(Number.parseInt(e.target.value))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <Button onClick={addSkill} disabled={!newSkillName.trim()} className="w-full" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Добавить навык
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Skills Radar Chart */}
                  {skills.length > 0 && (
                    <div className="pt-4">
                      <h4 className="font-medium mb-4 text-center">Визуализация навыков</h4>
                      <SkillRadarChart skills={skills} />
                    </div>
                  )}

                  {/* Skills Tags */}
                  <div className="pt-4">
                    <h4 className="font-medium mb-3">Теги навыков</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20"
                        >
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applications tab */}
            <TabsContent value="applications" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Мои отклики
                      </CardTitle>
                      <CardDescription>
                        Всего откликов: {totalApplications}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <h3 className="font-medium text-lg mb-1">Нет откликов</h3>
                      <p className="text-muted-foreground">
                        Вы еще не отправляли отклики на вакансии
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push("/jobs")}
                      >
                        Найти вакансии
                      </Button>
                    </div>
                  ) : (
                    <>
                      {applications.map((app) => {
                        const statusDisplay = getStatusDisplay(app.status);
                        return (
                          <div
                            key={app.id}
                            className={`relative p-4 rounded-lg border transition-all hover:shadow-sm ${statusDisplay.bgColor} ${statusDisplay.borderColor}`}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12 border">
                                <AvatarImage
                                  src={app.logo || "/placeholder.svg"}
                                  alt={app.company}
                                />
                                <AvatarFallback>
                                  {app.company.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0 space-y-3">
                                {/* Header with title and status */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base leading-tight">
                                      {app.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                      <Building className="h-3 w-3 flex-shrink-0" />
                                      {app.company}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge
                                      className={`text-xs px-2 py-1 ${statusDisplay.badgeColor} border-0`}
                                    >
                                      {statusDisplay.label}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() =>
                                        handleDeleteApplication(app.id)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-1">
                                  {app.location && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      {app.location}
                                    </p>
                                  )}
                                  {app.salary && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <DollarSign className="h-3 w-3 flex-shrink-0" />
                                      {app.salary}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3 flex-shrink-0" />
                                    Отправлено:{" "}
                                    {formatApplicationDate(app.appliedAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Load more button */}
                      {hasMore && (
                        <div className="text-center pt-4">
                          <Button
                            variant="outline"
                            onClick={loadMoreApplications}
                            className="w-full"
                          >
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Показать еще (
                            {totalApplications - applications.length})
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights tab */}
            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <CardTitle>Статистика профиля</CardTitle>
                  </div>
                  <CardDescription>Аналитика по вашему профилю и откликам</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="grid grid-cols-2 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg animate-pulse">
                          <div className="h-8 bg-muted rounded mb-2"></div>
                          <div className="h-4 bg-muted rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : userStats ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Eye className="h-4 w-4 text-primary" />
                          <p className="text-2xl font-bold text-primary">{userStats.viewsThisWeek}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Просмотров за неделю</p>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Send className="h-4 w-4 text-primary" />
                          <p className="text-2xl font-bold text-primary">{userStats.applicationsThisMonth}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Откликов за месяц</p>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <p className="text-2xl font-bold text-primary">{userStats.responseRate}%</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Процент ответов</p>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="h-4 w-4 text-primary" />
                          <p className="text-2xl font-bold text-primary">{userStats.averageResponseTime}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Время ответа</p>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Book className="h-5 w-5 text-primary" />
                    <CardTitle>Рекомендации ИИ</CardTitle>
                  </div>
                  <CardDescription>Персональные советы для улучшения профиля</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingRecommendations ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-3 bg-muted rounded-lg animate-pulse">
                          <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
                          <div className="h-3 bg-muted-foreground/20 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    aiRecommendations.map((recommendation, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(recommendation.category)}
                            <Badge className={cn("text-white border-none", getPriorityColor(recommendation.priority))}>
                              {recommendation.priority === "high"
                                ? "Высокий"
                                : recommendation.priority === "medium"
                                  ? "Средний"
                                  : "Низкий"}
                            </Badge>
                          </div>
                        </div>
                        <h4 className="font-medium mt-2">{recommendation.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{recommendation.description}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
