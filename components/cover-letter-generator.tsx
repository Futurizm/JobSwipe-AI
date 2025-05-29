"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, Copy, FileText, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface CoverLetterGeneratorProps {
  isOpen: boolean
  onClose: () => void
  job: {
    title: string
    company: string
    description: string
    requirements: string[]
  }
}

export function CoverLetterGenerator({ isOpen, onClose, job }: CoverLetterGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [copied, setCopied] = useState(false)
  const [customizations, setCustomizations] = useState({
    tone: "professional",
    length: "medium",
    focus: "skills",
  })

  // Generate cover letter based on job details
  const generateCoverLetter = () => {
    setIsGenerating(true)

    // Simulate AI generation with a delay
    setTimeout(() => {
      const tones = {
        professional: "Уважаемый работодатель,",
        friendly: "Здравствуйте!",
        confident: "С уверенностью заявляю, что",
      }

      const lengths = {
        short: 1,
        medium: 2,
        long: 3,
      }

      const focuses = {
        skills: `Мой опыт работы с ${job.requirements.slice(0, 3).join(", ")} позволит мне эффективно решать задачи на позиции ${job.title}.`,
        experience:
          "За годы работы я приобрел ценный опыт, который полностью соответствует требованиям вашей компании.",
        motivation: `Меня особенно привлекает возможность работать в ${job.company}, компании с отличной репутацией в своей области.`,
      }

      const intro = tones[customizations.tone as keyof typeof tones]
      const focus = focuses[customizations.focus as keyof typeof focuses]
      const paragraphCount = lengths[customizations.length as keyof typeof lengths]

      let letter = `${intro}

Я с большим интересом ознакомился с вакансией ${job.title} в компании ${job.company} и хотел бы предложить свою кандидатуру на эту должность.

${focus}
`

      if (paragraphCount >= 2) {
        letter += `
Изучив описание вакансии, я убедился, что мои навыки и опыт полностью соответствуют вашим требованиям. Я имею опыт работы с ${job.requirements.join(", ")}, что позволит мне быстро включиться в работу и приносить пользу компании с первых дней.
`
      }

      if (paragraphCount >= 3) {
        letter += `
На предыдущем месте работы я успешно реализовал несколько проектов, которые помогли компании улучшить эффективность и качество продукта. Я уверен, что смогу применить свой опыт и в вашей компании, способствуя ее дальнейшему развитию и успеху.
`
      }

      letter += `
Буду рад обсудить мою кандидатуру более подробно на личном собеседовании. Спасибо за рассмотрение моего обращения.

С уважением,
[Ваше имя]
`

      setCoverLetter(letter)
      setIsGenerating(false)
    }, 2000)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (isOpen) {
      generateCoverLetter()
    }
  }, [isOpen, customizations])

  if (!isOpen) return null

  return (
    <motion.div
      className="cover-letter-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="cover-letter-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="cover-letter-header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">AI Генератор сопроводительного письма</h2>
          </div>
          <button className="cover-letter-close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="cover-letter-content">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {job.title}
              </Badge>
              <Badge variant="outline">{job.company}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Персонализированное сопроводительное письмо, созданное на основе вашего резюме и описания вакансии.
            </p>
          </div>

          <Tabs defaultValue="result" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="result">Результат</TabsTrigger>
              <TabsTrigger value="customize">Настройки</TabsTrigger>
            </TabsList>

            <TabsContent value="result" className="space-y-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="cover-letter-loading">
                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <p className="mt-4 text-center text-muted-foreground">
                    Генерируем идеальное сопроводительное письмо...
                  </p>
                </div>
              ) : (
                <>
                  <Textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <Button variant="outline" onClick={generateCoverLetter} className="w-full sm:w-auto">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Сгенерировать заново
                    </Button>
                    <Button onClick={copyToClipboard} className="w-full sm:w-auto">
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Копировать
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="customize" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Тон письма</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={`cursor-pointer ${
                        customizations.tone === "professional" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => setCustomizations({ ...customizations, tone: "professional" })}
                    >
                      Профессиональный
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`cursor-pointer ${
                        customizations.tone === "friendly" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => setCustomizations({ ...customizations, tone: "friendly" })}
                    >
                      Дружелюбный
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`cursor-pointer ${
                        customizations.tone === "confident" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => setCustomizations({ ...customizations, tone: "confident" })}
                    >
                      Уверенный
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Длина письма</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={`cursor-pointer ${
                        customizations.length === "short" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => setCustomizations({ ...customizations, length: "short" })}
                    >
                      Короткое
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`cursor-pointer ${
                        customizations.length === "medium" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => setCustomizations({ ...customizations, length: "medium" })}
                    >
                      Среднее
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`cursor-pointer ${
                        customizations.length === "long" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => setCustomizations({ ...customizations, length: "long" })}
                    >
                      Длинное
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Акцент на</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={`cursor-pointer ${
                        customizations.focus === "skills" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => setCustomizations({ ...customizations, focus: "skills" })}
                    >
                      Навыки
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`cursor-pointer ${
                        customizations.focus === "experience" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => setCustomizations({ ...customizations, focus: "experience" })}
                    >
                      Опыт
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`cursor-pointer ${
                        customizations.focus === "motivation" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => setCustomizations({ ...customizations, focus: "motivation" })}
                    >
                      Мотивация
                    </Badge>
                  </div>
                </div>

                <Button className="w-full" onClick={generateCoverLetter}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Применить настройки
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="cover-letter-footer">
          <p className="text-xs text-muted-foreground">
            Сгенерированное письмо является шаблоном. Рекомендуется персонализировать его перед отправкой.
          </p>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
