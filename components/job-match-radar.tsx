"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AlertCircle, Bell, BellOff, ChevronRight, Clock, Radar, Settings, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface JobMatchRadarProps {
  isOpen: boolean
  onClose: () => void
}

// Mock data for job matches
const JOB_MATCHES = [
  {
    id: 101,
    title: "Senior Frontend Developer",
    company: "InnoTech",
    location: "Москва",
    salary: "220 000 - 280 000 ₽",
    matchPercentage: 95,
    logo: "/placeholder.svg?height=80&width=80",
    postedAgo: "2 часа назад",
    color: "#3498db",
    isNew: true,
    skills: ["React", "TypeScript", "Next.js", "Redux"],
  },
  {
    id: 102,
    title: "Frontend Team Lead",
    company: "DigitalWave",
    location: "Удаленно",
    salary: "250 000 - 320 000 ₽",
    matchPercentage: 92,
    logo: "/placeholder.svg?height=80&width=80",
    postedAgo: "5 часов назад",
    color: "#9b59b6",
    isNew: true,
    skills: ["React", "TypeScript", "Team Management", "Agile"],
  },
  {
    id: 103,
    title: "React Developer",
    company: "AppSolutions",
    location: "Санкт-Петербург",
    salary: "180 000 - 220 000 ₽",
    matchPercentage: 89,
    logo: "/placeholder.svg?height=80&width=80",
    postedAgo: "1 день назад",
    color: "#2ecc71",
    isNew: false,
    skills: ["React", "JavaScript", "CSS", "REST API"],
  },
  {
    id: 104,
    title: "Frontend Developer",
    company: "WebStudio",
    location: "Москва",
    salary: "160 000 - 200 000 ₽",
    matchPercentage: 87,
    logo: "/placeholder.svg?height=80&width=80",
    postedAgo: "2 дня назад",
    color: "#e74c3c",
    isNew: false,
    skills: ["JavaScript", "React", "HTML", "CSS"],
  },
]

export function JobMatchRadar({ isOpen, onClose }: JobMatchRadarProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanComplete, setScanComplete] = useState(false)
  const [matchThreshold, setMatchThreshold] = useState(80)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [scanFrequency, setScanFrequency] = useState(12) // hours
  const [jobMatches, setJobMatches] = useState<typeof JOB_MATCHES>([])
  const [activeTab, setActiveTab] = useState("matches")

  // Simulate radar scanning
  const startScan = () => {
    setIsScanning(true)
    setScanProgress(0)
    setScanComplete(false)

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsScanning(false)
          setScanComplete(true)
          setJobMatches(JOB_MATCHES)
          return 100
        }
        return prev + 5
      })
    }, 150)

    return () => clearInterval(interval)
  }

  // Start scan when component mounts
  useEffect(() => {
    if (isOpen && !scanComplete && !isScanning) {
      startScan()
    }
  }, [isOpen, scanComplete, isScanning])

  if (!isOpen) return null

  // Get match color based on percentage
  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return "#10b981" // success-500
    if (percentage >= 80) return "#22c55e" // green-500
    if (percentage >= 70) return "#f59e0b" // warning-500
    return "#ef4444" // red-500
  }

  return (
    <motion.div className="job-radar-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="job-radar-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="job-radar-header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Radar className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Job Match Radar</h2>
          </div>
          <button className="job-radar-close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <Tabs defaultValue="matches" className="w-full" onValueChange={setActiveTab}>
          <div className="px-4 pt-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="matches">Совпадения</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
            </TabsList>
          </div>

          <div className="job-radar-content">
            <TabsContent value="matches" className="mt-0">
              {isScanning ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="radar-animation">
                    <div className="radar-circle"></div>
                    <div className="radar-line"></div>
                  </div>
                  <h3 className="text-lg font-medium mt-6 mb-2">Сканирование рынка вакансий</h3>
                  <p className="text-muted-foreground mb-6 text-center">
                    Ищем вакансии, которые соответствуют вашему профилю и навыкам
                  </p>
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Прогресс</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="radar-progress">
                      <div className="radar-progress-bar" style={{ width: `${scanProgress}%` }}></div>
                    </div>
                  </div>
                </div>
              ) : scanComplete && jobMatches.length > 0 ? (
                <div className="space-y-4 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Найдено {jobMatches.length} совпадений</h3>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Обновлено 5 мин назад
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {jobMatches.map((job) => (
                      <div
                        key={job.id}
                        className={cn(
                          "border rounded-lg overflow-hidden transition-all",
                          job.isNew && "border-primary/30 bg-primary/5",
                        )}
                      >
                        {job.isNew && (
                          <div className="bg-primary text-primary-foreground text-xs px-3 py-1 text-center">
                            Новая вакансия
                          </div>
                        )}
                        <div className="p-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12 border">
                              <AvatarImage src={job.logo || "/placeholder.svg"} alt={job.company} />
                              <AvatarFallback style={{ backgroundColor: job.color, color: "white" }}>
                                {job.company.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-base truncate">{job.title}</h4>
                                  <p className="text-sm text-muted-foreground">{job.company}</p>
                                </div>
                                <div
                                  className="match-badge"
                                  style={{ backgroundColor: getMatchColor(job.matchPercentage) }}
                                >
                                  {job.matchPercentage}%
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-2">
                                {job.skills.map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {job.location}
                                  </Badge>
                                  <span>{job.postedAgo}</span>
                                </div>
                                <Button size="sm" className="h-8">
                                  Просмотреть
                                  <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full" onClick={startScan}>
                    <Radar className="mr-2 h-4 w-4" />
                    Сканировать снова
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="font-medium text-lg mb-2">Совпадения не найдены</h3>
                  <p className="text-muted-foreground mb-6">
                    Мы не нашли вакансий, соответствующих вашим критериям. Попробуйте изменить настройки или сканировать
                    снова.
                  </p>
                  <Button onClick={startScan}>
                    <Radar className="mr-2 h-4 w-4" />
                    Сканировать снова
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="mt-0 p-4 space-y-6">
              <div className="space-y-3">
                <h3 className="font-medium">Настройки сканирования</h3>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">Минимальный процент совпадения</p>
                      <p className="text-xs text-muted-foreground">
                        Показывать вакансии с совпадением от {matchThreshold}%
                      </p>
                    </div>
                    <span className="font-medium">{matchThreshold}%</span>
                  </div>
                  <Slider
                    value={[matchThreshold]}
                    min={50}
                    max={100}
                    step={5}
                    onValueChange={(value) => setMatchThreshold(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">Частота сканирования</p>
                      <p className="text-xs text-muted-foreground">Сканировать каждые {scanFrequency} часов</p>
                    </div>
                    <span className="font-medium">{scanFrequency}ч</span>
                  </div>
                  <Slider
                    value={[scanFrequency]}
                    min={1}
                    max={24}
                    step={1}
                    onValueChange={(value) => setScanFrequency(value[0])}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Уведомления</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Push-уведомления</p>
                    <p className="text-xs text-muted-foreground">Получать уведомления о новых совпадениях</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary mt-0.5">
                      {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {notificationsEnabled ? "Уведомления включены" : "Уведомления отключены"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notificationsEnabled
                          ? `Вы будете получать уведомления о новых вакансиях с совпадением от ${matchThreshold}%`
                          : "Включите уведомления, чтобы не пропустить подходящие вакансии"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Фильтры поиска</h3>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Настроить фильтры поиска
                  </a>
                </Button>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
                onClick={() => {
                  setActiveTab("matches")
                  startScan()
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Применить и сканировать
              </Button>
            </TabsContent>
          </div>
        </Tabs>

        <div className="job-radar-footer">
          <p className="text-xs text-muted-foreground">
            Job Match Radar автоматически сканирует рынок вакансий и находит подходящие предложения
          </p>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
