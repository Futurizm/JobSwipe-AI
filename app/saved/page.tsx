"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Briefcase, Clock, DollarSign, MapPin, Star, Trash2 } from "lucide-react"

// Mock data for saved jobs
const SAVED_JOBS = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "TechCorp",
    location: "Москва",
    salary: "150 000 - 200 000 ₽",
    matchPercentage: 92,
    logo: "/placeholder.svg?height=80&width=80",
    type: "Полная занятость",
    color: "#3498db",
    date: "2 дня назад",
  },
  {
    id: 3,
    title: "Backend Developer",
    company: "ServerPro",
    location: "Удаленно",
    salary: "180 000 - 250 000 ₽",
    matchPercentage: 78,
    logo: "/placeholder.svg?height=80&width=80",
    type: "Полная занятость",
    color: "#2ecc71",
    date: "5 дней назад",
  },
]

// Mock data for saved courses
const SAVED_COURSES = [
  {
    id: 1,
    title: "Полный курс по React.js",
    provider: "CodeMasters",
    duration: "20 часов",
    level: "Средний",
    rating: 4.8,
    image: "/placeholder.svg?height=200&width=400",
    color: "#3498db",
  },
  {
    id: 3,
    title: "Node.js для backend разработчиков",
    provider: "ServerPro",
    duration: "25 часов",
    level: "Продвинутый",
    rating: 4.9,
    image: "/placeholder.svg?height=200&width=400",
    color: "#2ecc71",
  },
]

export default function SavedPage() {
  const [jobs, setJobs] = useState(SAVED_JOBS)
  const [courses, setCourses] = useState(SAVED_COURSES)

  const removeJob = (id: number) => {
    setJobs(jobs.filter((job) => job.id !== id))
  }

  const removeCourse = (id: number) => {
    setCourses(courses.filter((course) => course.id !== id))
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/50 pt-4 px-4">
      <div className="w-full max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Сохраненное</h1>

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="jobs">Вакансии</TabsTrigger>
            <TabsTrigger value="courses">Курсы</TabsTrigger>
          </TabsList>

          {/* Saved jobs */}
          <TabsContent value="jobs" className="space-y-4">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <div key={job.id} className="border rounded-lg overflow-hidden">
                  <div className="h-2" style={{ backgroundColor: job.color }}></div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={job.logo || "/placeholder.svg"} alt={job.company} />
                        <AvatarFallback style={{ backgroundColor: job.color, color: "white" }}>
                          {job.company.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{job.title}</h3>
                            <p className="text-sm text-muted-foreground">{job.company}</p>
                          </div>
                          <Badge variant="outline">{job.matchPercentage}%</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {job.salary}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {job.type}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {job.date}
                          </Badge>
                        </div>

                        <div className="flex justify-between mt-4">
                          <Button>Откликнуться</Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                            onClick={() => removeJob(job.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-medium text-lg mb-1">Нет сохраненных вакансий</h3>
                <p className="text-muted-foreground">Сохраняйте интересные вакансии, чтобы вернуться к ним позже</p>
                <Button variant="outline" className="mt-4" asChild>
                  <a href="/jobs">Найти вакансии</a>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Saved courses */}
          <TabsContent value="courses" className="space-y-4">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div key={course.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="h-24 bg-cover bg-center relative"
                    style={{
                      backgroundImage: `url(${course.image})`,
                      backgroundColor: course.color,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                      <Badge className="bg-white/20 hover:bg-white/20 text-white border-none">{course.level}</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">{course.provider}</p>
                        <h3 className="font-bold text-lg">{course.title}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{course.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>Онлайн-курс</span>
                      </div>
                    </div>

                    <div className="flex justify-between mt-4">
                      <Button style={{ backgroundColor: course.color, borderColor: course.color }}>
                        Начать обучение
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={() => removeCourse(course.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-medium text-lg mb-1">Нет сохраненных курсов</h3>
                <p className="text-muted-foreground">Сохраняйте интересные курсы, чтобы вернуться к ним позже</p>
                <Button variant="outline" className="mt-4" asChild>
                  <a href="/courses">Найти курсы</a>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
