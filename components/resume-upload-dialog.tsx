"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, FileText, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResumeUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  file?: File
}

export function ResumeUploadDialog({ isOpen, onClose, fileName, file }: ResumeUploadDialogProps) {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [isUploaded, setIsUploaded] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resumeData, setResumeData] = useState<any>(null)

  useEffect(() => {
    if (isOpen && file) {
      processResume(file)
    } else if (!isOpen) {
      // Reset state when dialog closes
      setProgress(0)
      setIsUploaded(false)
      setSkills([])
      setError(null)
      setResumeData(null)
    }
  }, [isOpen, file])

  const processResume = async (file: File) => {
    setIsProcessing(true)
    setError(null)

    // Simulate initial upload progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 70) {
          clearInterval(progressInterval)
          return 70
        }
        return prev + 5
      })
    }, 100)

    try {
      // Create form data for file upload
      const formData = new FormData()
      formData.append("file", file)

      // Send to our API for parsing
      const response = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to process resume")
      }

      // Complete the progress
      clearInterval(progressInterval)
      setProgress(100)

      // Store the parsed resume data
      setResumeData(result.resumeData)

      // Extract skills for display
      if (result.resumeData.skills && Array.isArray(result.resumeData.skills)) {
        setSkills(result.resumeData.skills)
      }

      // Store resume data in localStorage for later use
      localStorage.setItem("resumeData", JSON.stringify(result.resumeData))

      setIsUploaded(true)
    } catch (error: any) {
      clearInterval(progressInterval)
      console.error("Error processing resume:", error)
      setError(error.message || "Failed to process resume")
      setProgress(0)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="resume-upload-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="resume-upload-card">
        {!isUploaded ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Загрузка резюме</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                <p className="font-medium">Ошибка при обработке резюме</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">{progress}% загружено</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Прогресс</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="resume-upload-progress">
                    <div className="resume-upload-progress-bar" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Анализируем ваше резюме для персонализации поиска работы...
                    </span>
                  ) : (
                    "Пожалуйста, подождите. Мы анализируем ваше резюме для персонализации поиска работы."
                  )}
                </p>
              </>
            )}
          </div>
        ) : (
          <motion.div
            className="resume-upload-success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="resume-upload-success-icon">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Резюме загружено!</h3>
            <p className="text-muted-foreground mb-4">Мы успешно проанализировали ваше резюме</p>

            <div className="w-full p-4 bg-muted/30 rounded-lg mb-4">
              <h4 className="font-medium mb-2">Обнаруженные навыки:</h4>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span key={skill} className="skill-tag matched">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Навыки не обнаружены</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Закрыть
              </Button>
              <Button className="flex-1" onClick={() => router.push("/jobs")}>
                Начать поиск
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
