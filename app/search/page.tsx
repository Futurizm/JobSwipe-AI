"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useMotionValue } from "framer-motion"
import { ArrowLeft, Briefcase, Check, Clock, DollarSign, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// Mock data for job cards
const JOBS = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "TechCorp",
    location: "Москва",
    salary: "150 000 - 200 000 ₽",
    description:
      "Мы ищем опытного Frontend разработчика для создания современных веб-приложений. Вы будете работать с React, TypeScript и современными инструментами разработки.",
    requirements: ["React", "TypeScript", "CSS", "HTML", "Git"],
    matchPercentage: 92,
    logo: "/placeholder.svg?height=80&width=80",
    type: "Полная занятость",
    experience: "3-5 лет",
  },
  {
    id: 2,
    title: "UX/UI Designer",
    company: "DesignStudio",
    location: "Санкт-Петербург",
    salary: "120 000 - 180 000 ₽",
    description:
      "Требуется талантливый UX/UI дизайнер для создания интуитивных и красивых интерфейсов. Вы будете работать над проектами для крупных клиентов.",
    requirements: ["Figma", "Adobe XD", "Prototyping", "User Research"],
    matchPercentage: 85,
    logo: "/placeholder.svg?height=80&width=80",
    type: "Полная занятость",
    experience: "2-4 года",
  },
  {
    id: 3,
    title: "Backend Developer",
    company: "ServerPro",
    location: "Удаленно",
    salary: "180 000 - 250 000 ₽",
    description:
      "Ищем Backend разработчика для создания высоконагруженных систем. Вы будете работать с Node.js, MongoDB и AWS.",
    requirements: ["Node.js", "MongoDB", "AWS", "Express", "REST API"],
    matchPercentage: 78,
    logo: "/placeholder.svg?height=80&width=80",
    type: "Полная занятость",
    experience: "4-6 лет",
  },
]

export default function SearchPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<string | null>(null)
  const [likedJobs, setLikedJobs] = useState<number[]>([])

  // For card swiping
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useMotionValue(0)

  const bindSwipe = {
    onDragStart: () => {
      // Start drag
    },
    onDrag: (_: any, info: { offset: { x: number; y: number } }) => {
      x.set(info.offset.x)
      y.set(info.offset.y)
      rotate.set(info.offset.x * 0.1)

      // Show overlay based on direction
      if (info.offset.x > 100) {
        setDirection("right")
      } else if (info.offset.x < -100) {
        setDirection("left")
      } else {
        setDirection(null)
      }
    },
    onDragEnd: (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (info.offset.x > 100 || (info.velocity.x > 0.5 && info.offset.x > 50)) {
        // Swipe right - like
        handleLike()
      } else if (info.offset.x < -100 || (info.velocity.x < -0.5 && info.offset.x < -50)) {
        // Swipe left - skip
        handleSkip()
      } else {
        // Reset position
        x.set(0)
        y.set(0)
        rotate.set(0)
        setDirection(null)
      }
    },
  }

  const handleLike = () => {
    if (currentIndex < JOBS.length) {
      setLikedJobs([...likedJobs, JOBS[currentIndex].id])

      // Animate out
      x.set(500)

      // Move to next card
      setTimeout(() => {
        x.set(0)
        y.set(0)
        rotate.set(0)
        setDirection(null)
        setCurrentIndex(currentIndex + 1)
      }, 200)
    }
  }

  const handleSkip = () => {
    if (currentIndex < JOBS.length) {
      // Animate out
      x.set(-500)

      // Move to next card
      setTimeout(() => {
        x.set(0)
        y.set(0)
        rotate.set(0)
        setDirection(null)
        setCurrentIndex(currentIndex + 1)
      }, 200)
    }
  }

  const currentJob = JOBS[currentIndex]

  // Get match color based on percentage
  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return "#10b981" // success-500
    if (percentage >= 75) return "#22c55e" // green-500
    if (percentage >= 60) return "#f59e0b" // warning-500
    return "#ef4444" // red-500
  }

  if (currentIndex >= JOBS.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="w-full max-w-md space-y-8">
          <div className="p-6 bg-card rounded-lg shadow-lg border">
            <h2 className="text-2xl font-bold mb-4">Вакансии закончились</h2>
            <p className="text-muted-foreground mb-6">
              Вы просмотрели все доступные вакансии. Вам понравилось {likedJobs.length} вакансий.
            </p>

            {likedJobs.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Понравившиеся вакансии:</h3>
                <div className="space-y-2">
                  {likedJobs.map((id) => {
                    const job = JOBS.find((j) => j.id === id)
                    return job ? (
                      <div key={id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={job.logo || "/placeholder.svg"} alt={job.company} />
                          <AvatarFallback>{job.company.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.company}</p>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {job.matchPercentage}%
                        </Badge>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push("/")}>Вернуться на главную</Button>
              <Button variant="outline" onClick={() => setCurrentIndex(0)}>
                Начать заново
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/50">
      <header className="p-4 flex items-center border-b">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium mx-auto">Поиск вакансий</h1>
      </header>

      <main className="flex-1 p-4 flex flex-col">
        <div className="relative w-full max-w-md mx-auto h-[70vh] flex items-center justify-center">
          <motion.div
            className="absolute w-full h-full"
            style={{ x, y, rotate, touchAction: "none" }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.9}
            {...bindSwipe}
          >
            <div className="w-full h-full bg-card rounded-xl shadow-lg border overflow-hidden">
              {/* Card content */}
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-4 flex items-center gap-3 border-b">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={currentJob.logo || "/placeholder.svg"} alt={currentJob.company} />
                    <AvatarFallback>{currentJob.company.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="font-bold text-lg">{currentJob.title}</h2>
                    <p className="text-sm text-muted-foreground">{currentJob.company}</p>
                  </div>

                  {/* Match percentage */}
                  <div
                    className="match-percentage"
                    style={
                      {
                        "--match-percentage": `${currentJob.matchPercentage}%`,
                        "--match-color": getMatchColor(currentJob.matchPercentage),
                      } as React.CSSProperties
                    }
                  >
                    <span className="match-percentage-text">{currentJob.matchPercentage}%</span>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {currentJob.location}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {currentJob.salary}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {currentJob.type}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {currentJob.experience}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Описание</h3>
                    <p className="text-sm text-muted-foreground">{currentJob.description}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Требуемые навыки</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentJob.requirements.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Соответствие навыков</h3>
                    <div className="space-y-2">
                      {currentJob.requirements.map((skill, index) => {
                        // Generate random match for each skill (in a real app this would come from resume parsing)
                        const skillMatch = Math.floor(Math.random() * 40) + 60
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{skill}</span>
                              <span>{skillMatch}%</span>
                            </div>
                            <Progress value={skillMatch} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlay for like/dislike */}
              <div className={cn("swipe-card-overlay swipe-card-overlay-like", direction === "right" && "active")}>
                <div className="border-4 border-success-500 rounded-full p-2">
                  <Check className="h-8 w-8" />
                </div>
              </div>
              <div className={cn("swipe-card-overlay swipe-card-overlay-nope", direction === "left" && "active")}>
                <div className="border-4 border-destructive rounded-full p-2">
                  <X className="h-8 w-8" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full border-2 border-destructive"
            onClick={handleSkip}
          >
            <X className="h-6 w-6 text-destructive" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full border-2 border-success-500"
            onClick={handleLike}
          >
            <Check className="h-6 w-6 text-success-500" />
          </Button>
        </div>
      </main>
    </div>
  )
}
