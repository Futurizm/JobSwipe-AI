"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, Copy, Edit3, FileText, Loader2, Send, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CoverLetterPreviewProps {
  isOpen: boolean
  onClose: () => void
  onApply: (coverLetter: string) => Promise<void>
  job: {
    id: string
    title: string
    company: string
    description: string
    requirements: string[]
  }
  isApplying: boolean
}

export function CoverLetterPreview({ isOpen, onClose, onApply, job, isApplying }: CoverLetterPreviewProps) {
  const [coverLetter, setCoverLetter] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editedLetter, setEditedLetter] = useState("")

  // Generate cover letter when dialog opens
  useEffect(() => {
    if (isOpen && !coverLetter) {
      generateCoverLetter()
    }
  }, [isOpen])

  const generateCoverLetter = async () => {
    setIsGenerating(true)

    try {
      // Get resume data from localStorage
      const storedResumeData = localStorage.getItem("resumeData")
      let resumeData = null

      if (storedResumeData) {
        try {
          resumeData = JSON.parse(storedResumeData)
        } catch (error) {
          console.error("Error parsing resume data:", error)
        }
      }

      // Try to generate with AI
      if (resumeData) {
        const response = await fetch("/api/cover-letter/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeData,
            vacancyData: job,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.coverLetter) {
            setCoverLetter(result.coverLetter)
            setEditedLetter(result.coverLetter)
            setIsGenerating(false)
            return
          }
        }
      }

      // Fallback to template letter
      const fallbackLetter = generateFallbackLetter()
      setCoverLetter(fallbackLetter)
      setEditedLetter(fallbackLetter)
    } catch (error) {
      console.error("Error generating cover letter:", error)
      const fallbackLetter = generateFallbackLetter()
      setCoverLetter(fallbackLetter)
      setEditedLetter(fallbackLetter)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateFallbackLetter = () => {
    return `Уважаемый работодатель,

Я с большим интересом ознакомился с вакансией ${job.title} в компании ${job.company} и хотел бы предложить свою кандидатуру на эту должность.

Изучив описание вакансии, я убедился, что мои навыки и опыт полностью соответствуют вашим требованиям. Мой профессиональный опыт позволит мне эффективно выполнять поставленные задачи и вносить ценный вклад в работу вашей команды.

Я готов применить свои знания и навыки для достижения целей компании и буду рад обсудить возможности сотрудничества более подробно.

Буду рад обсудить мою кандидатуру на личном собеседовании. Спасибо за рассмотрение моего обращения.

С уважением,
[Ваше имя]`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedLetter : coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    setCoverLetter(editedLetter)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedLetter(coverLetter)
    setIsEditing(false)
  }

  const handleApply = async () => {
    const letterToSend = isEditing ? editedLetter : coverLetter
    await onApply(letterToSend)
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Сопроводительное письмо</h2>
              <p className="text-sm text-gray-500">
                {job.company} • {job.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-900">Генерируем письмо</h3>
              <p className="text-gray-500 text-center">
                Создаем персонализированное сопроводительное письмо на основе вашего резюме...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {job.title}
                  </Badge>
                  <Badge variant="outline">{job.company}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Копировать
                      </>
                    )}
                  </Button>
                  {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="gap-1">
                      <Edit3 className="h-4 w-4" />
                      Редактировать
                    </Button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedLetter}
                    onChange={(e) => setEditedLetter(e.target.value)}
                    className="min-h-[300px] font-mono text-sm resize-none"
                    placeholder="Введите текст сопроводительного письма..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1">
                      <Check className="mr-2 h-4 w-4" />
                      Сохранить
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="flex-1">
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-gray-700">
                      {coverLetter}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3" />
              <span>Персонализировано ИИ</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="min-w-[100px]">
              Отмена
            </Button>
            <Button
              onClick={handleApply}
              disabled={isApplying || isGenerating || (!coverLetter && !editedLetter)}
              className={cn(
                "bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 min-w-[110px]",
                isApplying && "opacity-50",
              )}
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Отправляем...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Отклик
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
