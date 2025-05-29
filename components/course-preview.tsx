"use client"

import { motion } from "framer-motion"
import { Award, BookOpen, Clock, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CoursePreviewProps {
  isOpen: boolean
  onClose: () => void
  course: {
    id: number
    title: string
    provider: string
    duration: string
    level: string
    rating: number
    reviews: number
    students: number
    skills: string[]
    image: string
    color: string
    description?: string
    chapters?: { title: string; duration: string }[]
  }
}

export function CoursePreview({ isOpen, onClose, course }: CoursePreviewProps) {
  if (!isOpen) return null

  // Mock course description and chapters if not provided
  const description =
    course.description ||
    "Этот курс предоставляет полное руководство по изучению технологии от основ до продвинутых концепций. Вы изучите практические навыки, которые можно сразу применить в реальных проектах."

  const chapters = course.chapters || [
    { title: "Введение в курс", duration: "15 минут" },
    { title: "Основы и настройка окружения", duration: "45 минут" },
    { title: "Базовые концепции", duration: "1 час 20 минут" },
    { title: "Практические примеры", duration: "2 часа" },
    { title: "Продвинутые техники", duration: "1 час 30 минут" },
    { title: "Работа с реальными проектами", duration: "3 часа" },
    { title: "Оптимизация и лучшие практики", duration: "1 час" },
    { title: "Финальный проект", duration: "2 часа 30 минут" },
  ]

  return (
    <motion.div
      className="course-preview-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="course-preview-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div
          className="course-preview-header"
          style={{
            backgroundImage: `url(${course.image})`,
            backgroundColor: course.color,
          }}
        >
          <div className="course-preview-header-overlay">
            <Badge className="self-start bg-white/20 hover:bg-white/20 text-white border-none mb-2">
              {course.level}
            </Badge>
            <h2 className="text-2xl font-bold mb-1">{course.title}</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm">{course.provider}</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">
                  {course.rating} ({course.reviews} отзывов)
                </span>
              </div>
            </div>
          </div>
          <button className="course-preview-close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="course-preview-content">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{course.students.toLocaleString()} студентов</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span>Сертификат по окончании</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">О курсе</h3>
            <p className="text-muted-foreground">{description}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">Навыки, которые вы получите</h3>
            <div className="flex flex-wrap gap-2">
              {course.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-3">Содержание курса</h3>
            <div className="space-y-3">
              {chapters.map((chapter, index) => (
                <div key={index} className="flex justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{index + 1}.</span>
                    <span className="text-sm">{chapter.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{chapter.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="course-preview-footer">
          <div>
            <p className="font-medium">Бесплатно</p>
            <p className="text-xs text-muted-foreground">Полный доступ ко всем материалам</p>
          </div>
          <Button style={{ backgroundColor: course.color, borderColor: course.color }}>Начать обучение</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
