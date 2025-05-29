"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Briefcase,
  Check,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  MapPin,
  Search,
  X,
  Plus,
  Minus,
  Loader2,
  TrendingUp,
  Star,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import {
  getStoredToken,
  getUserResumes,
  applyToVacancy,
  hasAppliedToVacancy,
  getVacancies,
  convertHHVacancyToJob,
} from "@/lib/headhunter"
import { useToast } from "@/hooks/use-toast"
import { JobMatchRadar } from "@/components/job-match-radar"
import { CoverLetterPreview } from "@/components/cover-letter-preview"
import { saveApplication, hasAppliedToVacancyLocal } from "@/lib/applications"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface Profession {
  id: number
  title: string
  description: string
  matchPercentage: number
  averageSalary: string
  demandLevel: "Высокий" | "Средний" | "Низкий"
  requiredSkills: string[]
  growthProspects: string
  vacanciesCount: number
}

// Function to generate AI-powered job analysis
const generateJobAnalysis = async (job: any): Promise<{ pros: string[]; cons: string[] }> => {
  try {
    const response = await fetch("/api/generate-job-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vacancyData: job }),
    })

    if (!response.ok) {
      throw new Error("Failed to generate analysis")
    }

    const data = await response.json()
    return {
      pros: data.pros || [],
      cons: data.cons || [],
    }
  } catch (error) {
    console.error("Error generating job analysis:", error)
    return {
      pros: [
        "Интересная позиция с возможностью роста",
        "Работа с современными технологиями",
        "Стабильная компания с хорошей репутацией",
        "Возможность профессионального развития",
      ],
      cons: [
        "Высокие требования к квалификации",
        "Возможны периодические переработки",
        "Высокая ответственность за результаты",
      ],
    }
  }
}

// Функция для получения ID области для городов Казахстана
function getKazakhstanCityAreaId(cityName: string): string | null {
  const kazakhstanCities: { [key: string]: string } = {
    Алматы: "160",
    Астана: "162",
    "Нур-Султан": "162",
    Шымкент: "161",
    Караганда: "164",
    Актобе: "165",
    Тараз: "166",
    Павлодар: "167",
    "Усть-Каменогорск": "168",
    Семей: "169",
    Атырау: "170",
    Костанай: "171",
    Кызылорда: "172",
    Уральск: "173",
    Петропавловск: "174",
    Актау: "175",
    Темиртау: "176",
    Туркестан: "177",
    Кокшетау: "178",
    Талдыкорган: "179",
    Экибастуз: "180",
  }
  return kazakhstanCities[cityName] || null
}

// Функция для проверки, является ли локация казахстанской
function isKazakhstanLocation(location: string): boolean {
  const kazakhstanKeywords = [
    "Казахстан",
    "Kazakhstan",
    "Алматы",
    "Астана",
    "Нур-Султан",
    "Шымкент",
    "Караганда",
    "Актобе",
    "Тараз",
    "Павлодар",
    "Усть-Каменогорск",
    "Семей",
    "Атырау",
    "Костанай",
    "Кызылорда",
    "Уральск",
    "Петропавловск",
    "Актау",
    "Темиртау",
    "Туркестан",
    "Кокшетау",
    "Талдыкорган",
    "Экибастуз",
  ]
  return kazakhstanKeywords.some((keyword) => location.toLowerCase().includes(keyword.toLowerCase()))
}

export default function JobsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<string | null>(null)
  const [likedJobs, setLikedJobs] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userResumes, setUserResumes] = useState<any[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [appliedJobs, setAppliedJobs] = useState<string[]>([])
  const [showRadar, setShowRadar] = useState(false)
  const [showCoverLetter, setShowCoverLetter] = useState(false)
  const [currentJob, setCurrentJob] = useState<any>(null)
  const [resumeSkills, setResumeSkills] = useState<string[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [swipeEnabled, setSwipeEnabled] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState<{ [key: string]: boolean }>({})
  const [professions, setProfessions] = useState<Profession[]>([])
  const [professionsLoading, setProfessionsLoading] = useState(false)

  // Reference to track if component is mounted
  const isMounted = useRef(false)

  // Motion values for the current card
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-350, 0, 320], [-15, 0, 15])

  // Memoized current job to prevent unnecessary re-renders
  const currentJobData = useMemo(() => {
    return jobs[currentIndex] || null
  }, [jobs, currentIndex])

  // Load resume data from localStorage
  useEffect(() => {
    const storedResumeData = localStorage.getItem("resumeData")
    if (storedResumeData) {
      try {
        const resumeData = JSON.parse(storedResumeData)
        if (resumeData.skills && Array.isArray(resumeData.skills)) {
          setResumeSkills(resumeData.skills)
        }
      } catch (error) {
        console.error("Error parsing stored resume data:", error)
      }
    }
  }, [])

  // Function to generate analysis for a specific job
  const generateAnalysisForJob = useCallback(async (job: any, index: number) => {
    if (job.pros && job.cons) return // Already has analysis

    setAnalysisLoading((prev) => ({ ...prev, [job.id]: true }))

    try {
      const analysis = await generateJobAnalysis(job)

      setJobs((prevJobs) => {
        const newJobs = [...prevJobs]
        if (newJobs[index]) {
          newJobs[index] = { ...newJobs[index], ...analysis }
        }
        return newJobs
      })
    } catch (error) {
      console.error("Failed to generate analysis for job:", job.id, error)
    } finally {
      setAnalysisLoading((prev) => ({ ...prev, [job.id]: false }))
    }
  }, [])

  // Fetch jobs and resumes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const tokenData = getStoredToken()
        if (tokenData) {
          // Fetch user resumes first
          const resumesResponse = await getUserResumes(tokenData.access_token)
          setUserResumes(resumesResponse.items || [])

          // Set the first published resume as selected
          const publishedResume = resumesResponse.items?.find((resume: any) => resume.status?.id === "published")
          if (publishedResume) {
            setSelectedResumeId(publishedResume.id)
          }

          // Get user's preferred city from settings or localStorage
          const userCity = localStorage.getItem("userCity") || "Павлодар"

          // Prepare search parameters for Kazakhstan cities
          const searchParams: any = { per_page: 20 }

          // If we have resume skills, use them for search
          if (resumeSkills.length > 0) {
            const skillsForSearch = resumeSkills.slice(0, 3).join(" ")
            searchParams.text = skillsForSearch
          }

          let fetchedJobs: any[] = []

          try {
            // First, try to get vacancies from user's specific city in Kazakhstan
            const cityAreaId = getKazakhstanCityAreaId(userCity)
            if (cityAreaId) {
              searchParams.area = cityAreaId
              console.log(`Searching for jobs in ${userCity} (area: ${cityAreaId})`)

              const cityVacanciesResponse = await getVacancies(tokenData.access_token, searchParams)
              fetchedJobs = cityVacanciesResponse.items.map(convertHHVacancyToJob)

              console.log(`Found ${fetchedJobs.length} jobs in ${userCity}`)
            }

            // If we don't have enough jobs from the specific city, expand to all Kazakhstan
            if (fetchedJobs.length < 10) {
              console.log(`Not enough jobs in ${userCity}, expanding search to all Kazakhstan`)

              // Search in all major Kazakhstan cities
              const kazakhstanAreaId = "40" // Kazakhstan country code
              searchParams.area = kazakhstanAreaId

              const kazakhstanVacanciesResponse = await getVacancies(tokenData.access_token, searchParams)
              const kazakhstanJobs = kazakhstanVacanciesResponse.items.map(convertHHVacancyToJob)

              // Filter out jobs we already have from the city search
              const newJobs = kazakhstanJobs.filter(
                (job) => !fetchedJobs.some((existingJob) => existingJob.id === job.id),
              )

              fetchedJobs = [...fetchedJobs, ...newJobs]
              console.log(`Total jobs after expanding to Kazakhstan: ${fetchedJobs.length}`)
            }

            // If still not enough, try without area restriction but with Kazakhstan-specific keywords
            if (fetchedJobs.length < 15) {
              console.log("Adding more Kazakhstan jobs with broader search")

              delete searchParams.area
              searchParams.text = (searchParams.text || "") + " Казахстан OR Алматы OR Астана OR Шымкент"

              const broadVacanciesResponse = await getVacancies(tokenData.access_token, searchParams)
              const broadJobs = broadVacanciesResponse.items.map(convertHHVacancyToJob).filter(
                (job) =>
                  isKazakhstanLocation(job.location) && !fetchedJobs.some((existingJob) => existingJob.id === job.id),
              )

              fetchedJobs = [...fetchedJobs, ...broadJobs]
              console.log(`Final job count: ${fetchedJobs.length}`)
            }
          } catch (searchError) {
            console.error("Error in Kazakhstan job search:", searchError)
            // Fallback to general search if Kazakhstan-specific search fails
            delete searchParams.area
            const fallbackResponse = await getVacancies(tokenData.access_token, searchParams)
            fetchedJobs = fallbackResponse.items
              .map(convertHHVacancyToJob)
              .filter((job) => isKazakhstanLocation(job.location))
          }

          setJobs(fetchedJobs)

          // Check which jobs user has already applied to (both API and local)
          const appliedJobIds: string[] = []
          for (const job of fetchedJobs) {
            const hasAppliedAPI = await hasAppliedToVacancy(tokenData.access_token, job.id)
            const hasAppliedLocal = hasAppliedToVacancyLocal(job.id)
            if (hasAppliedAPI || hasAppliedLocal) {
              appliedJobIds.push(job.id)
            }
          }
          setAppliedJobs(appliedJobIds)
        } else {
          setJobs(MOCK_JOBS)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setJobs(MOCK_JOBS)
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить вакансии. Используем демо-данные.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setSwipeEnabled(true)
      }
    }

    fetchData()
  }, [toast, resumeSkills.length])

  // Generate analysis for current job when it changes
  useEffect(() => {
    if (currentJobData && !currentJobData.pros && !currentJobData.cons) {
      generateAnalysisForJob(currentJobData, currentIndex)
    }
  }, [currentJobData, currentIndex, generateAnalysisForJob])

  // Initialize swipe functionality and handle component mount
  useEffect(() => {
    isMounted.current = true

    if (!loading && jobs.length > 0) {
      x.set(0)
      setDirection(null)
      setIsAnimating(false)
      setSwipeEnabled(true)
    }

    return () => {
      isMounted.current = false
    }
  }, [loading, jobs.length, x])

  // Load professions based on resume
  const loadProfessions = useCallback(async () => {
    setProfessionsLoading(true)
    try {
      const storedResumeData = localStorage.getItem("resumeData")
      if (!storedResumeData) {
        setProfessions([
          {
            id: 1,
            title: "Frontend Developer",
            description: "Разработка пользовательских интерфейсов для веб-приложений",
            matchPercentage: 85,
            averageSalary: "120 000 - 200 000 ₽",
            demandLevel: "Высокий" as const,
            requiredSkills: ["JavaScript", "React", "HTML", "CSS"],
            growthProspects: "Отличные перспективы роста в IT-сфере",
            vacanciesCount: 1250,
          },
          {
            id: 2,
            title: "UX/UI Designer",
            description: "Создание интуитивных и привлекательных пользовательских интерфейсов",
            matchPercentage: 75,
            averageSalary: "100 000 - 180 000 ₽",
            demandLevel: "Высокий" as const,
            requiredSkills: ["Figma", "Adobe XD", "Prototyping"],
            growthProspects: "Растущий спрос на UX/UI специалистов",
            vacanciesCount: 890,
          },
        ])
        setProfessionsLoading(false)
        return
      }

      const resumeData = JSON.parse(storedResumeData)
      const response = await fetch("/api/professions/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeData }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.professions) {
          setProfessions(result.professions)
        }
      } else {
        throw new Error("Failed to load professions")
      }
    } catch (error) {
      console.error("Error loading professions:", error)
      setProfessions([
        {
          id: 1,
          title: "Frontend Developer",
          description: "Разработка пользовательских интерфейсов для веб-приложений",
          matchPercentage: 85,
          averageSalary: "120 000 - 200 000 ₽",
          demandLevel: "Высокий" as const,
          requiredSkills: ["JavaScript", "React", "HTML", "CSS"],
          growthProspects: "Отличные перспективы роста в IT-сфере",
          vacanciesCount: 1250,
        },
      ])
    } finally {
      setProfessionsLoading(false)
    }
  }, [])

  // Load professions when component mounts
  useEffect(() => {
    loadProfessions()
  }, [loadProfessions])

  // Helper functions for professions
  const getDemandColor = useCallback((level: string) => {
    switch (level) {
      case "Высокий":
        return "bg-success-500"
      case "Средний":
        return "bg-warning-500"
      case "Низкий":
        return "bg-destructive"
      default:
        return "bg-muted"
    }
  }, [])

  const getProfessionMatchColor = useCallback((percentage: number) => {
    if (percentage >= 90) return "text-success-600"
    if (percentage >= 75) return "text-success-500"
    if (percentage >= 60) return "text-warning-500"
    return "text-destructive"
  }, [])

  // Handle drag
  const handleDrag = useCallback(
    (_: any, info: { offset: { x: number } }) => {
      if (isAnimating || !swipeEnabled || showDetails) return
      if (info.offset.x > 30) {
        setDirection("right")
      } else if (info.offset.x < -30) {
        setDirection("left")
      } else {
        setDirection(null)
      }
    },
    [isAnimating, swipeEnabled, showDetails],
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (isAnimating || !swipeEnabled || showDetails) return
      const swipeThreshold = 80
      const velocityThreshold = 0.3
      setDirection(null)
      if (info.offset.x > swipeThreshold || (info.velocity.x > velocityThreshold && info.offset.x > 30)) {
        handleLike()
      } else if (info.offset.x < -swipeThreshold || (info.velocity.x < -velocityThreshold && info.offset.x < -30)) {
        handleSkip()
      } else {
        x.set(0)
      }
    },
    [isAnimating, swipeEnabled, showDetails, x],
  )

  const handleLike = useCallback(() => {
    if (currentIndex < jobs.length && !isAnimating) {
      const job = jobs[currentIndex]
      setIsAnimating(true)
      setDirection(null)
      setLikedJobs((prev) => [...prev, job])
      x.set(window.innerWidth + 100)
      rotate.set(15)
      setTimeout(() => {
        if (isMounted.current) {
          setCurrentIndex((prev) => prev + 1)
          x.set(0)
          setIsAnimating(false)
        }
      }, 250)
      saveApplication({
        vacancyId: job.id,
        title: job.title,
        company: job.company,
        logo: job.logo,
        salary: job.salary,
        location: job.location,
        description: job.description,
      })
      const tokenData = getStoredToken()
      if (tokenData && selectedResumeId && !appliedJobs.includes(job.id)) {
        applyToVacancy(tokenData.access_token, job.id, selectedResumeId)
          .then(() => {
            if (isMounted.current) {
              setAppliedJobs((prev) => [...prev, job.id])
              toast({
                title: "🎉 Отклик отправлен!",
                description: "Ваш отклик на вакансию успешно отправлен",
              })
            }
          })
          .catch((error: any) => {
            if (!error.message?.includes("already_applied") && !error.message?.includes("Доступ запрещен")) {
              console.error("Error applying to vacancy:", error)
            }
          })
      }
    }
  }, [currentIndex, jobs, selectedResumeId, appliedJobs, toast, isAnimating, x, rotate])

  const handleSkip = useCallback(() => {
    if (currentIndex < jobs.length && !isAnimating) {
      setIsAnimating(true)
      setDirection(null)
      x.set(-(window.innerWidth + 100))
      rotate.set(-15)
      setTimeout(() => {
        if (isMounted.current) {
          setCurrentIndex((prev) => prev + 1)
          x.set(0)
          setIsAnimating(false)
        }
      }, 250)
    }
  }, [currentIndex, jobs.length, isAnimating, x, rotate])

  const handleApplyWithCoverLetter = async (coverLetter: string) => {
    if (!selectedResumeId || isApplying || !currentJob) return
    setIsApplying(true)
    try {
      const tokenData = getStoredToken()
      if (!tokenData) {
        throw new Error("Токен не найден")
      }
      if (appliedJobs.includes(currentJob.id)) {
        toast({
          title: "Уже откликались",
          description: "Вы уже отправляли отклик на эту вакансию",
        })
        return
      }
      await applyToVacancy(tokenData.access_token, currentJob.id, selectedResumeId, coverLetter)
      setAppliedJobs((prev) => [...prev, currentJob.id])
      saveApplication({
        vacancyId: currentJob.id,
        title: currentJob.title,
        company: currentJob.company,
        logo: currentJob.logo,
        salary: currentJob.salary,
        location: currentJob.location,
        description: currentJob.description,
        coverLetter,
      })
      setShowCoverLetter(false)
      toast({
        title: "🎉 Отклик отправлен!",
        description: "Ваш отклик с персонализированным письмом успешно отправлен",
      })
    } catch (error: any) {
      console.error("Error applying to vacancy:", error)
      const errorMessage = error.message || "Не удалось отправить отклик на вакансию"
      if (errorMessage.includes("already_applied") || errorMessage.includes("Вы уже откликались")) {
        setAppliedJobs((prev) => [...prev, currentJob.id])
        saveApplication({
          vacancyId: currentJob.id,
          title: currentJob.title,
          company: currentJob.company,
          logo: currentJob.logo,
          salary: currentJob.salary,
          location: currentJob.location,
          description: currentJob.description,
          coverLetter,
        })
        toast({
          title: "Уже откликались",
          description: "Вы уже отправляли отклик на эту вакансию",
        })
      } else {
        toast({
          title: "Ошибка при отправке отклика",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsApplying(false)
    }
  }

  const openVacancyInHH = useCallback(() => {
    if (currentJobData?.alternate_url) {
      window.open(currentJobData.alternate_url, "_blank")
    } else {
      toast({
        title: "Ссылка недоступна",
        description: "Не удалось открыть вакансию на HeadHunter",
        variant: "destructive",
      })
    }
  }, [currentJobData, toast])

  const calculateSkillMatch = useCallback(
    (jobSkill: string): number => {
      if (!resumeSkills.length) return Math.floor(Math.random() * 40) + 60
      const normalizedJobSkill = jobSkill.toLowerCase()
      const normalizedResumeSkills = resumeSkills.map((skill) => skill.toLowerCase())
      if (normalizedResumeSkills.includes(normalizedJobSkill)) {
        return 100
      }
      for (const resumeSkill of normalizedResumeSkills) {
        if (normalizedJobSkill.includes(resumeSkill) || resumeSkill.includes(normalizedJobSkill)) {
          return 85
        }
      }
      return Math.floor(Math.random() * 40) + 60
    },
    [resumeSkills],
  )

  const getMatchColor = useCallback((percentage: number) => {
    if (percentage >= 90) return "from-emerald-500 to-green-500"
    if (percentage >= 75) return "from-green-500 to-lime-500"
    if (percentage >= 60) return "from-yellow-500 to-orange-500"
    return "from-red-500 to-pink-500"
  }, [])

  const getMatchTextColor = useCallback((percentage: number) => {
    if (percentage >= 90) return "text-emerald-600"
    if (percentage >= 75) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }, [])

  const enableSwipe = useCallback(() => {
    if (!swipeEnabled) {
      setSwipeEnabled(true)
    }
  }, [swipeEnabled])

  // Форматирование зарплаты для отображения
  const formatSalary = (salary: string) => {
    if (!salary || salary === "Не указано") return "Не указана"
    return salary
  }

  // Форматирование опыта для отображения
  const formatExperience = (experience: string) => {
    if (!experience || experience === "Не указано") return "Не указан"
    return experience
  }

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-b from-blue-50 to-slate-100 flex flex-col overflow-hidden">
        <header className="px-4 py-3 flex items-center border-b bg-white/80 backdrop-blur-sm shrink-0">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold mx-auto text-blue-600">Поиск</h1>
        </header>
        <main className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="animate-pulse w-full max-w-sm h-full mx-4">
            <div className="rounded-2xl bg-white/70 w-full h-full shadow-md border border-gray-100"></div>
          </div>
        </main>
      </div>
    )
  }

  if (currentIndex >= jobs.length) {
    return (
      <div className="h-screen bg-gradient-to-b from-blue-50 to-slate-100 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-md">
          <div className="p-8 bg-white rounded-2xl shadow-md border border-gray-100 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-blue-600">Вакансии закончились</h2>
              <p className="text-gray-600 mb-6">
                Вы просмотрели все доступные вакансии. Вам понравилось {likedJobs.length} вакансий.
              </p>
            </div>
            {likedJobs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-gray-800">Понравившиеся вакансии:</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {likedJobs.map((job) => (
                    <div key={job.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Avatar className="h-10 w-10 border border-gray-100">
                        <AvatarImage src={job.logo || "/placeholder.svg"} alt={job.company} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {job.company.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{job.title}</p>
                        <p className="text-sm text-gray-600 truncate">{job.company}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-0">{job.matchPercentage}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700 h-11 rounded-xl">
                Вернуться на главную
              </Button>
              <Button variant="outline" onClick={() => setCurrentIndex(0)} className="h-11 rounded-xl border-gray-200">
                Начать заново
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentJobData) return null

  const isCurrentJobAnalysisLoading = analysisLoading[currentJobData.id]

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-slate-100">
      <header className="px-4 py-2 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="hover:bg-blue-50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto text-blue-600">Поиск</h1>
        <Button variant="ghost" size="icon" onClick={() => setShowRadar(true)} className="hover:bg-blue-50">
          <Search className="h-5 w-5" />
        </Button>
      </header>
      <main className="flex-1 p-4 flex flex-col">
        <div className="w-full max-w-md mx-auto">
          <Tabs defaultValue="vacancies" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="vacancies">Вакансии</TabsTrigger>
              <TabsTrigger value="professions">Профессии</TabsTrigger>
            </TabsList>
            <TabsContent value="vacancies" className="mt-0">
              <div className="w-full h-[85vh] relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    className="w-full h-full"
                    style={{ x, rotate }}
                    drag={swipeEnabled ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                    whileDrag={{ scale: 1.02 }}
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onTouchStart={enableSwipe}
                    onMouseDown={enableSwipe}
                  >
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden relative h-full flex flex-col">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl"></div>
                      <div className="p-3 flex items-center gap-3 border-b bg-gray-50/50 shrink-0">
                        <Avatar className="h-12 w-12 border-2 border-gray-100 shadow-sm">
                          <AvatarImage src={currentJobData.logo || "/placeholder.svg"} alt={currentJobData.company} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                            {currentJobData.company.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-lg text-gray-800 truncate">{currentJobData.title}</h2>
                          <p className="text-gray-600 truncate text-sm">{currentJobData.company}</p>
                        </div>
                        <div className="flex items-center justify-center h-12 w-12 rounded-full border-2 border-blue-500 bg-blue-50">
                          <span className="font-bold text-sm text-blue-600">{currentJobData.matchPercentage}%</span>
                        </div>
                      </div>
                      <div className="flex-1 p-3 flex flex-col space-y-2 overflow-hidden">
                        <div className="grid grid-cols-2 gap-1">
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 px-2 py-1 rounded-full justify-center text-xs h-7"
                          >
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{currentJobData.location || "Не указано"}</span>
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 px-2 py-1 rounded-full justify-center text-xs h-7"
                          >
                            <DollarSign className="h-3 w-3" />
                            <span className="truncate">{formatSalary(currentJobData.salary)}</span>
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 px-2 py-1 rounded-full justify-center text-xs h-7"
                          >
                            <Briefcase className="h-3 w-3" />
                            <span className="truncate">{currentJobData.type || "Не указано"}</span>
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 px-2 py-1 rounded-full justify-center text-xs h-7"
                          >
                            <Clock className="h-3 w-3" />
                            <span className="truncate">{formatExperience(currentJobData.experience)}</span>
                          </Badge>
                        </div>
                        <div className="flex-1 space-y-2 min-h-0 flex flex-col">
                          {isCurrentJobAnalysisLoading ? (
                            <div className="flex items-center justify-center h-full flex-1">
                              <div className="flex flex-col items-center gap-2 text-blue-600">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-sm">ИИ анализирует вакансию...</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <h3 className="text-xs font-semibold text-green-600 mb-1 flex items-center">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Преимущества
                                </h3>
                                <div className="space-y-1 mb-2">
                                  {currentJobData.pros?.map((pro: string, index: number) => (
                                    <div key={index} className="text-xs text-gray-700 bg-green-50 px-2 py-1 rounded-lg">
                                      • {pro}
                                    </div>
                                  )) || <div className="text-xs text-gray-500 italic">Анализ загружается...</div>}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xs font-semibold text-red-600 mb-1 flex items-center">
                                  <Minus className="h-3 w-3 mr-1" />
                                  Недостатки
                                </h3>
                                <div className="space-y-1">
                                  {currentJobData.cons?.map((con: string, index: number) => (
                                    <div key={index} className="text-xs text-gray-700 bg-red-50 px-2 py-1 rounded-lg">
                                      • {con}
                                    </div>
                                  )) || <div className="text-xs text-gray-500 italic">Анализ загружается...</div>}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full h-8 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 text-xs"
                            onClick={() => setShowDetails(true)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Подробно
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              className="gap-1 h-8 rounded-xl border-gray-200 text-xs"
                              onClick={openVacancyInHH}
                            >
                              <ExternalLink className="h-3 w-3" />
                              HH
                            </Button>
                            <Button
                              className="gap-1 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs"
                              onClick={() => {
                                setCurrentJob(currentJobData)
                                setShowCoverLetter(true)
                              }}
                              disabled={appliedJobs.includes(currentJobData.id)}
                            >
                              {appliedJobs.includes(currentJobData.id) ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  Откликнулись
                                </>
                              ) : (
                                <>
                                  <FileText className="h-3 w-3" />
                                  Отклик
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="flex justify-between pt-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-full border-2 border-red-500 bg-white shadow-lg hover:bg-red-50"
                              onClick={() => {
                                enableSwipe()
                                handleSkip()
                              }}
                              disabled={isAnimating}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-full border-2 border-green-500 bg-white shadow-lg hover:bg-green-50"
                              onClick={() => {
                                enableSwipe()
                                handleLike()
                              }}
                              disabled={isAnimating}
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {direction === "right" && !isAnimating && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white font-bold rounded-full p-4 z-30 shadow-xl">
                          <Check className="h-6 w-6" />
                        </div>
                      )}
                      {direction === "left" && !isAnimating && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white font-bold rounded-full p-4 z-30 shadow-xl">
                          <X className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </TabsContent>
            <TabsContent value="professions" className="mt-0">
              {professionsLoading ? (
                <div className="flex flex-col items-center justify-center h-[60vh] p-6">
                  <div className="animate-pulse space-y-4 w-full max-w-md">
                    <div className="h-32 bg-muted rounded-lg"></div>
                    <div className="h-32 bg-muted rounded-lg"></div>
                    <div className="h-32 bg-muted rounded-lg"></div>
                  </div>
                  <p className="mt-4 text-muted-foreground text-center">
                    Анализируем ваше резюме и подбираем подходящие профессии...
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {professions.map((profession) => (
                    <Card key={profession.id} className="w-full">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{profession.title}</CardTitle>
                            <CardDescription className="mt-1">{profession.description}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-2xl font-bold", getProfessionMatchColor(profession.matchPercentage))}>
                              {profession.matchPercentage}%
                            </div>
                            <div className="text-xs text-muted-foreground">совпадение</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Зарплата</span>
                            </div>
                            <p className="font-medium text-sm">{profession.averageSalary}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Спрос</span>
                            </div>
                            <Badge className={cn("text-white border-none", getDemandColor(profession.demandLevel))}>
                              {profession.demandLevel}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Ключевые навыки</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {profession.requiredSkills.map((skill, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className={cn(
                                  "text-xs",
                                  resumeSkills.some(
                                    (s) =>
                                      s.toLowerCase() === skill.toLowerCase() ||
                                      s.toLowerCase().includes(skill.toLowerCase()) ||
                                      skill.toLowerCase().includes(s.toLowerCase()),
                                  ) && "bg-primary/20 text-primary",
                                )}
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Перспективы</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{profession.growthProspects}</p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div className="text-sm text-muted-foreground">
                            {profession.vacanciesCount.toLocaleString()} вакансий
                          </div>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
                          >
                            Смотреть вакансии
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      {showDetails && currentJobData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full bg-white rounded-t-3xl h-[80vh] overflow-hidden"
          >
            <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Подробная информация</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(80vh-80px)] space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  Описание
                </h3>
                <p className="text-gray-700 leading-relaxed">{currentJobData.description}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
                  Требуемые навыки
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentJobData.requirements?.length > 0 ? (
                    currentJobData.requirements.map((skill: string, index: number) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={cn(
                          "px-3 py-1 rounded-full",
                          resumeSkills.some(
                            (s) =>
                              s.toLowerCase() === skill.toLowerCase() ||
                              s.toLowerCase().includes(skill.toLowerCase()) ||
                              skill.toLowerCase().includes(s.toLowerCase()),
                          ) && "bg-blue-100 text-blue-700 border-blue-200",
                        )}
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-600 text-sm">Навыки не указаны</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <Check className="h-4 w-4 mr-2 text-blue-600" />
                  Соответствие навыков
                </h3>
                {currentJobData.requirements?.length > 0 ? (
                  <div className="space-y-3">
                    {currentJobData.requirements.map((skill: string, index: number) => {
                      const skillMatch = calculateSkillMatch(skill)
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{skill}</span>
                            <span className={cn(getMatchTextColor(skillMatch))}>{skillMatch}%</span>
                          </div>
                          <Progress value={skillMatch} className="h-2.5 rounded-full" />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">Нет данных о соответствии навыков</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <JobMatchRadar isOpen={showRadar} onClose={() => setShowRadar(false)} />
      {currentJob && (
        <CoverLetterPreview
          isOpen={showCoverLetter}
          onClose={() => setShowCoverLetter(false)}
          onApply={handleApplyWithCoverLetter}
          job={currentJob}
          isApplying={isApplying}
        />
      )}
    </div>
  )
}

// Mock data for job cards if API fails
const MOCK_JOBS = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "TechCorp",
    location: "Алматы",
    salary: "150 000 - 200 000 ₸",
    description: "Мы ищем Frontend разработчика для создания современных веб-приложений в Казахстане.",
    requirements: ["React", "TypeScript", "CSS", "JavaScript"],
    matchPercentage: 92,
    logo: "/placeholder.svg?height=80&width=80",
    type: "Полная занятость",
    experience: "3-5 лет",
    alternate_url: "https://hh.ru/vacancy/123456",
  },
  {
    id: "2",
    title: "UX/UI Designer",
    company: "DesignStudio",
    location: "Астана",
    salary: "120 000 - 180 000 ₸",
    description: "Создание интуитивных интерфейсов для клиентов в Казахстане.",
    requirements: ["Figma", "Adobe XD", "Prototyping"],
    matchPercentage: 85,
    logo: "/placeholder.svg?height=80&width=80",
    type: "Полная занятость",
    experience: "2-4 года",
    alternate_url: "https://hh.ru/vacancy/123457",
  },
  {
    id: "3",
    title: "Backend Developer",
    company: "ServerPro",
    location: "Шымкент",
    salary: "180 000 - 250 000 ₸",
    description: "Разработка серверов для проектов в Казахстане.",
    requirements: ["Node.js", "MongoDB", "AWS"],
    matchPercentage: 78,
    logo: "/placeholder.svg?height=80&width=80",
    type: "Полная занятость",
    experience: "4-6 лет",
    alternate_url: "https://hh.ru/vacancy/123458",
  },
]