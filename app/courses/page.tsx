"use client"

import { useState } from "react"
import { Search, BookOpen, Clock, Star, Award, ChevronRight, BookmarkIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { CoursePreview } from "@/components/course-preview"

// Mock data for courses
const COURSES = [
  {
    id: 1,
    title: "Полный курс по React.js",
    provider: "CodeMasters",
    duration: "20 часов",
    level: "Средний",
    rating: 4.8,
    reviews: 342,
    students: 12500,
    skills: ["React", "JavaScript", "Redux", "Hooks"],
    image: "/placeholder.svg?height=200&width=400",
    color: "#3498db",
    progress: 0,
  },
  {
    id: 2,
    title: "TypeScript с нуля до профи",
    provider: "WebAcademy",
    duration: "15 часов",
    level: "Начальный",
    rating: 4.7,
    reviews: 215,
    students: 8900,
    skills: ["TypeScript", "JavaScript", "OOP"],
    image: "/placeholder.svg?height=200&width=400",
    color: "#9b59b6",
    progress: 35,
  },
  {
    id: 3,
    title: "Node.js для backend разработчиков",
    provider: "ServerPro",
    duration: "25 часов",
    level: "Продвинутый",
    rating: 4.9,
    reviews: 189,
    students: 5600,
    skills: ["Node.js", "Express", "MongoDB", "REST API"],
    image: "/placeholder.svg?height=200&width=400",
    color: "#2ecc71",
    progress: 0,
  },
  {
    id: 4,
    title: "Основы UX/UI дизайна",
    provider: "DesignSchool",
    duration: "18 часов",
    level: "Начальный",
    rating: 4.6,
    reviews: 278,
    students: 9800,
    skills: ["Figma", "UI Design", "UX Research", "Prototyping"],
    image: "/placeholder.svg?height=200&width=400",
    color: "#e74c3c",
    progress: 75,
  },
  {
    id: 5,
    title: "Python для анализа данных",
    provider: "DataScience",
    duration: "30 часов",
    level: "Средний",
    rating: 4.8,
    reviews: 412,
    students: 15600,
    skills: ["Python", "Pandas", "NumPy", "Data Visualization"],
    image: "/placeholder.svg?height=200&width=400",
    color: "#f39c12",
    progress: 0,
  },
  {
    id: 6,
    title: "DevOps практики и инструменты",
    provider: "CloudMasters",
    duration: "22 часа",
    level: "Продвинутый",
    rating: 4.7,
    reviews: 156,
    students: 4300,
    skills: ["Docker", "Kubernetes", "CI/CD", "AWS"],
    image: "/placeholder.svg?height=200&width=400",
    color: "#1abc9c",
    progress: 0,
  },
]

// Mock data for skills
const SKILLS = [
  "JavaScript",
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "HTML/CSS",
  "UI/UX",
  "DevOps",
  "Data Science",
  "Machine Learning",
]

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [savedCourses, setSavedCourses] = useState<number[]>([])
  const [selectedCourse, setSelectedCourse] = useState<(typeof COURSES)[0] | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const toggleSaveCourse = (id: number) => {
    if (savedCourses.includes(id)) {
      setSavedCourses(savedCourses.filter((courseId) => courseId !== id))
    } else {
      setSavedCourses([...savedCourses, id])
    }
  }

  const openCoursePreview = (course: (typeof COURSES)[0]) => {
    setSelectedCourse(course)
    setIsPreviewOpen(true)
  }

  // Filter courses based on search query and selected skills
  const filteredCourses = COURSES.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSkills = selectedSkills.length === 0 || selectedSkills.some((skill) => course.skills.includes(skill))

    return matchesSearch && matchesSkills
  })

  // Group courses by progress
  const inProgressCourses = filteredCourses.filter((course) => course.progress > 0)
  const recommendedCourses = filteredCourses.filter((course) => course.progress === 0)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/50 pt-4 px-4">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Search and filter */}
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Поиск курсов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1 -mx-1 px-1">
            <Badge
              variant="outline"
              className={cn(
                "px-3 py-1 cursor-pointer whitespace-nowrap",
                selectedSkills.length === 0 && "bg-primary text-primary-foreground",
              )}
              onClick={() => setSelectedSkills([])}
            >
              Все
            </Badge>
            {SKILLS.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className={cn(
                  "px-3 py-1 cursor-pointer whitespace-nowrap",
                  selectedSkills.includes(skill) && "bg-primary text-primary-foreground",
                )}
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Courses tabs */}
        <Tabs defaultValue="recommended" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="recommended">Рекомендуемые</TabsTrigger>
            <TabsTrigger value="inProgress">В процессе</TabsTrigger>
          </TabsList>

          {/* Recommended courses */}
          <TabsContent value="recommended" className="space-y-4">
            {recommendedCourses.length > 0 ? (
              recommendedCourses.map((course) => (
                <div key={course.id} className="course-card border overflow-hidden">
                  <div
                    className="course-card-image"
                    style={{
                      backgroundImage: `url(${course.image})`,
                      backgroundColor: course.color,
                    }}
                  >
                    <div className="course-card-overlay">
                      <div className="flex justify-between items-center">
                        <Badge className="bg-white/20 hover:bg-white/20 text-white border-none">{course.level}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
                          onClick={() => toggleSaveCourse(course.id)}
                        >
                          <BookmarkIcon className={cn("h-4 w-4", savedCourses.includes(course.id) && "fill-white")} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">{course.provider}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{course.rating}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-lg leading-tight">{course.title}</h3>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.students.toLocaleString()} студентов</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {course.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      className="w-full"
                      style={{ backgroundColor: course.color, borderColor: course.color }}
                      onClick={() => openCoursePreview(course)}
                    >
                      Начать обучение
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-medium text-lg mb-1">Курсы не найдены</h3>
                <p className="text-muted-foreground">Попробуйте изменить параметры поиска или выбрать другие навыки</p>
              </div>
            )}
          </TabsContent>

          {/* In progress courses */}
          <TabsContent value="inProgress" className="space-y-4">
            {inProgressCourses.length > 0 ? (
              inProgressCourses.map((course) => (
                <div key={course.id} className="course-card border overflow-hidden">
                  <div
                    className="course-card-image"
                    style={{
                      backgroundImage: `url(${course.image})`,
                      backgroundColor: course.color,
                    }}
                  >
                    <div className="course-card-overlay">
                      <div className="flex justify-between items-center">
                        <Badge className="bg-white/20 hover:bg-white/20 text-white border-none">{course.level}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
                          onClick={() => toggleSaveCourse(course.id)}
                        >
                          <BookmarkIcon className={cn("h-4 w-4", savedCourses.includes(course.id) && "fill-white")} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">{course.provider}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{course.rating}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-lg leading-tight">{course.title}</h3>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Прогресс</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="course-progress">
                        <div className="course-progress-bar" style={{ width: `${course.progress}%` }}></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>{course.reviews} отзывов</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      style={{ backgroundColor: course.color, borderColor: course.color }}
                      onClick={() => openCoursePreview(course)}
                    >
                      Продолжить
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-medium text-lg mb-1">У вас нет начатых курсов</h3>
                <p className="text-muted-foreground">Начните обучение, чтобы отслеживать свой прогресс</p>
                <Button variant="outline" className="mt-4">
                  Найти курсы
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Course preview dialog */}
      {selectedCourse && (
        <CoursePreview isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} course={selectedCourse} />
      )}
    </div>
  )
}
