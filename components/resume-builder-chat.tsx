"use client"

import type React from "react"
import { useState, useRef, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export interface ResumeBuilderChatRef {
  scrollToChat: () => void
}

interface ResumeBuilderChatProps {
  className?: string
  isOpen?: boolean
}

export const ResumeBuilderChat = forwardRef<ResumeBuilderChatRef, ResumeBuilderChatProps>(({ className, isOpen }, ref) => {
  const [userInput, setUserInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    scrollToChat: () => {
      if (chatRef.current) {
        chatRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    },
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите информацию о себе",
        variant: "destructive",
      })
      return
    }

    if (resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/resume/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userInput }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Не удалось создать резюме")
      }

      const htmlContent = await response.text()

      const newTab = window.open()
      if (newTab) {
        newTab.document.write(htmlContent)
        newTab.document.close()
      } else {
        if (iframeRef.current) {
          const iframe = iframeRef.current
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

          if (iframeDoc) {
            iframeDoc.open()
            iframeDoc.write(htmlContent)
            iframeDoc.close()
            iframe.style.display = "block"
          }
        }

        toast({
          title: "Внимание",
          description: "Всплывающее окно заблокировано. Резюме отображается ниже.",
        })
      }

      toast({
        title: "Успех!",
        description: "Резюме успешно создано",
      })
    } catch (error) {
      console.error("Error generating resume:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать резюме",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isOpen ? (
        <div ref={chatRef} className={className}>
          <Card className="w-full max-w-sm mx-auto">
            <CardHeader>
              <CardTitle>AI Генератор Резюме</CardTitle>
              <CardDescription>
                Введите информацию о себе, и ИИ создаст профессиональное резюме. Чем больше информации вы предоставите, тем
                точнее будет результат.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Расскажите о себе, своем опыте работы, образовании, навыках и т.д."
                    className="min-h-[100px]"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                </div>
                <div className="mt-2">
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Создание резюме..." : "Создать резюме"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-sm text-gray-500">
                <p>
                  <strong>Совет:</strong> Укажите свое имя, контактные данные, опыт работы, образование и навыки. Если
                  вас недостаточно информации, ИИ дополнит её автоматически.
                </p>
              </div>
            </CardFooter>
            <div ref={resultRef} className="mt-4">
              {isLoading && (
                <Card className="w-full">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <p className="text-sm font-medium">Создание резюме...</p>
                      <p className="text-sm text-gray-500 text-center">
                        ИИ анализирует вашу информацию и создает профессиональное резюме
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              <iframe
                ref={iframeRef}
                style={{
                  display: "none",
                  width: "100%",
                  height: "400px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  marginTop: "1rem",
                }}
                title="Resume Preview"
              />
            </div>
          </Card>
          </div>
        ) : null}
      </>
    )
})

ResumeBuilderChat.displayName = "ResumeBuilderChat"