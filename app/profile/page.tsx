"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Award,
  BarChart3,
  Book,
  Briefcase,
  Download,
  FileText,
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

// Mock user data
const USER = {
  name: "Александр Иванов",
  email: "alex@example.com",
  avatar: "/placeholder.svg?height=100&width=100",
  position: "Frontend Developer",
  experience: "5 лет",
  education: "МГУ, Компьютерные науки",
  resume: {
    filename: "resume.pdf",
    lastUpdated: "15.05.2023",
  },
  insights: {
    viewsThisWeek: 12,
    applicationsThisMonth: 8,
    responseRate: 65,
    averageResponseTime: "2 дня",
  },
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isInTelegram, user } = useTelegram()
  const [skills, setSkills] = useState<{ name: string; level: number }[]>([])
  const [isEditingSkills, setIsEditingSkills] = useState(false)
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillLevel, setNewSkillLevel] = useState(50)

  // Applications state
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalApplications, setTotalApplications] = useState(0)
  const [showAllApplications, setShowAllApplications] = useState(false)
  const applicationsPerPage = 5

  // Настраиваем кнопку "Назад" для Telegram
  useEffect(() => {
    if (isInTelegram) {
      setupBackButton(() => router.push("/"))
    }
  }, [isInTelegram, router])

  // Load skills from localStorage on component mount
  useEffect(() => {
    const loadSkillsFromResume = () => {
      const storedResumeData = localStorage.getItem("resumeData")
      if (storedResumeData) {
        try {
          const resumeData = JSON.parse(storedResumeData)
          if (resumeData.skills && Array.isArray(resumeData.skills)) {
            // Convert skills to the format with levels
            const skillsWithLevels = resumeData.skills.map((skill: string) => ({
              name: skill,
              level: Math.floor(Math.random() * 30) + 70, // Random level between 70-100
            }))
            setSkills(skillsWithLevels)
          }
        } catch (error) {
          console.error("Error parsing stored resume data:", error)
          // Fallback to default skills if parsing fails
          setSkills([
            { name: "JavaScript", level: 90 },
            { name: "React", level: 85 },
            { name: "TypeScript", level: 80 },
            { name: "HTML/CSS", level: 95 },
            { name: "Node.js", level: 70 },
            { name: "Git", level: 75 },
          ])
        }
      } else {
        // Default skills if no resume data
        setSkills([
          { name: "JavaScript", level: 90 },
          { name: "React", level: 85 },
          { name: "TypeScript", level: 80 },
          { name: "HTML/CSS", level: 95 },
          { name: "Node.js", level: 70 },
          { name: "Git", level: 75 },
        ])
      }
    }

    loadSkillsFromResume()
  }, [])

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

  // Save skills to localStorage
  const saveSkillsToResume = (updatedSkills: { name: string; level: number }[]) => {
    const storedResumeData = localStorage.getItem("resumeData")
    if (storedResumeData) {
      try {
        const resumeData = JSON.parse(storedResumeData)
        resumeData.skills = updatedSkills.map((skill) => skill.name)
        localStorage.setItem("resumeData", JSON.stringify(resumeData))
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

  // Получаем данные пользователя
  const userName = isInTelegram && user ? `${user.first_name} ${user.last_name || ""}`.trim() : USER.name
  const userAvatar = isInTelegram && user?.photo_url ? user.photo_url : USER.avatar
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

      <main className="flex-1 p-4">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Profile header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-xl font-bold">{userName}</h2>
              <p className="text-muted-foreground">{USER.position}</p>
              {isInTelegram && user?.username && <p className="text-sm text-primary">@{user.username}</p>}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Pencil className="h-4 w-4" />
                Редактировать
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
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
                  {isInTelegram && user?.username && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telegram:</span>
                      <span>@{user.username}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{USER.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Должность:</span>
                    <span>{USER.position}</span>
                  </div>
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
                  <p>{USER.experience}</p>
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
                  <p>{USER.education}</p>
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

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Файл резюме</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Имя файла:</span>
                    <span>{USER.resume.filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Последнее обновление:</span>
                    <span>{USER.resume.lastUpdated}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-2">
                    <Download className="mr-2 h-4 w-4" />
                    Скачать резюме
                  </Button>
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
                      <CardDescription>Всего откликов: {totalApplications}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <h3 className="font-medium text-lg mb-1">Нет откликов</h3>
                      <p className="text-muted-foreground">Вы еще не отправляли отклики на вакансии</p>
                      <Button variant="outline" className="mt-4" onClick={() => router.push("/jobs")}>
                        Найти вакансии
                      </Button>
                    </div>
                  ) : (
                    <>
                      {applications.map((app) => (
                        <div key={app.id} className="application-card">
                          <div className="flex items-start gap-3 p-4">
                            <Avatar className="h-12 w-12 border">
                              <AvatarImage src={app.logo || "/placeholder.svg"} alt={app.company} />
                              <AvatarFallback>{app.company.substring(0, 2)}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="min-w-0">
                                  <h3 className="font-bold text-base truncate">{app.title}</h3>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {app.company}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteApplication(app.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Application details */}
                              <div className="space-y-2 mb-3">
                                {app.location && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {app.location}
                                  </p>
                                )}
                                {app.salary && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {app.salary}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Отправлено: {formatApplicationDate(app.appliedAt)}
                                </p>
                              </div>

                              {/* Status and actions */}
                              <div className="flex items-center justify-between">
                                <Badge className={`${APPLICATION_STATUSES[app.status].color} text-white border-none`}>
                                  {APPLICATION_STATUSES[app.status].label}
                                </Badge>

                                <div className="flex gap-2">
                                  {/* Status update buttons */}
                                  {app.status === "sent" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleStatusChange(app.id, "viewed")}
                                    >
                                      Просмотрено
                                    </Button>
                                  )}
                                  {(app.status === "sent" || app.status === "viewed") && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleStatusChange(app.id, "interview")}
                                      className="text-success-600 border-success-600 hover:bg-success-50"
                                    >
                                      Собеседование
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Load more button */}
                      {hasMore && (
                        <div className="text-center pt-4">
                          <Button variant="outline" onClick={loadMoreApplications} className="w-full">
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Показать еще ({totalApplications - applications.length})
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
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">{USER.insights.viewsThisWeek}</p>
                    <p className="text-sm text-muted-foreground">Просмотров за неделю</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">{totalApplications}</p>
                    <p className="text-sm text-muted-foreground">Всего откликов</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">{USER.insights.responseRate}%</p>
                    <p className="text-sm text-muted-foreground">Процент ответов</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">{USER.insights.averageResponseTime}</p>
                    <p className="text-sm text-muted-foreground">Среднее время ответа</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Book className="h-5 w-5 text-primary" />
                    <CardTitle>Рекомендации по улучшению</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">Добавьте больше информации о проектах</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Работодатели на 35% чаще откликаются на резюме с подробным описанием проектов
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">Обновите фотографию профиля</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Профессиональное фото увеличивает шансы на отклик на 24%
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">Добавьте сертификаты</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Подтвержденные навыки повышают доверие работодателей
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
