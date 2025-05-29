"use client"

import type React from "react"

import { useState, useRef, forwardRef, useImperativeHandle } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, Download, FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface ResumeBuilderChatProps {
  isOpen: boolean
  onClose: () => void
}

export interface ResumeBuilderChatRef {
  scrollToChat: () => void
}

export const ResumeBuilderChat = forwardRef<ResumeBuilderChatRef, ResumeBuilderChatProps>(
  ({ isOpen, onClose }, ref) => {
    const [message, setMessage] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedResume, setGeneratedResume] = useState<string | null>(null)
    const [isDownloading, setIsDownloading] = useState(false)
    const chatRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()

    useImperativeHandle(ref, () => ({
      scrollToChat: () => {
        if (chatRef.current) {
          chatRef.current.scrollIntoView({ behavior: "smooth" })
        }
      },
    }))

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!message.trim() || isGenerating) return

      setIsGenerating(true)
      setGeneratedResume(null)

      try {
        const response = await fetch("/api/resume/generate-html", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userInput: message }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Не удалось создать резюме")
        }

        const htmlContent = await response.text()
        setGeneratedResume(htmlContent)

        toast({
          title: "✅ Резюме создано!",
          description: "Ваше резюме успешно сгенерировано. Теперь вы можете скачать PDF.",
        })
      } catch (error) {
        console.error("Error generating resume:", error)
        toast({
          title: "❌ Ошибка",
          description: error instanceof Error ? error.message : "Не удалось создать резюме",
          variant: "destructive",
        })
      } finally {
        setIsGenerating(false)
      }
    }

    const handleDownloadPDF = async () => {
      if (!message.trim() || isDownloading) return

      setIsDownloading(true)

      try {
        console.log("Starting PDF download...")

        const response = await fetch("/api/resume/download-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userInput: message }),
        })

        console.log("Response status:", response.status)
        console.log("Response headers:", Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Server error:", errorData)
          throw new Error(errorData.details || errorData.error || "Ошибка сервера")
        }

        // Check if response is actually a PDF
        const contentType = response.headers.get("content-type")
        if (!contentType?.includes("application/pdf")) {
          throw new Error("Сервер вернул неправильный тип файла")
        }

        const blob = await response.blob()
        console.log("PDF blob size:", blob.size)

        if (blob.size === 0) {
          throw new Error("Получен пустой файл")
        }

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "resume.pdf"
        a.style.display = "none"

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        // Clean up
        window.URL.revokeObjectURL(url)

        toast({
          title: "✅ PDF скачан!",
          description: "Ваше резюме успешно скачано в формате PDF.",
        })
      } catch (error) {
        console.error("Error downloading PDF:", error)
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"

        toast({
          title: "❌ Ошибка скачивания",
          description: `Не удалось скачать PDF: ${errorMessage}`,
          variant: "destructive",
        })
      } finally {
        setIsDownloading(false)
      }
    }

    if (!isOpen) return null

    return (
      <motion.div
        ref={chatRef}
        className="fixed inset-0 bg-black/50 z-50 flex items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full bg-white rounded-t-3xl h-[85vh] overflow-hidden flex flex-col"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">AI Резюме Билдер</h2>
                <p className="text-sm text-gray-600">Создайте профессиональное резюме с помощью ИИ</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Расскажите о себе</h3>
                <p className="text-gray-600 text-sm">
                  Опишите свой опыт работы, навыки, образование и другую информацию для резюме
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Например: Меня зовут Иван Петров, я frontend разработчик с 3 годами опыта. Работал в компании TechCorp, знаю React, JavaScript, TypeScript..."
                  className="min-h-[120px] resize-none"
                  disabled={isGenerating}
                />

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={!message.trim() || isGenerating}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Создаю резюме...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Создать резюме
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadPDF}
                    disabled={!message.trim() || isDownloading}
                    className="px-6"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Скачиваю...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Generated Resume Preview */}
              <AnimatePresence>
                {generatedResume && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">Предпросмотр резюме</span>
                      </div>
                    </div>
                    <div className="h-96 overflow-y-auto">
                      <iframe srcDoc={generatedResume} className="w-full h-full border-0" title="Resume Preview" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  },
)

ResumeBuilderChat.displayName = "ResumeBuilderChat"
