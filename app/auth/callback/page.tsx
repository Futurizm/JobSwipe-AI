"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { exchangeCodeForToken, storeToken } from "@/lib/headhunter"
import { Button } from "@/components/ui/button"
import { Check, Loader2, XCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    if (error) {
      setStatus("error")
      setErrorMessage(errorDescription || "Произошла ошибка при авторизации")
      return
    }

    if (!code) {
      setStatus("error")
      setErrorMessage("Отсутствует код авторизации")
      return
    }

    // Exchange code for token
    exchangeCodeForToken(code)
      .then((tokenData) => {
        // Store token
        storeToken(tokenData)
        setStatus("success")

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/")
        }, 2000)
      })
      .catch((error) => {
        console.error("Error exchanging code for token:", error)
        setStatus("error")
        setErrorMessage(error.message || "Произошла ошибка при получении токена")
      })
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/50">
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-8 text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold">Авторизация в HeadHunter</h1>
            <p className="text-muted-foreground">Пожалуйста, подождите, идет обработка авторизации...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-success-500/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-success-500" />
            </div>
            <h1 className="text-2xl font-bold">Авторизация успешна!</h1>
            <p className="text-muted-foreground">Вы успешно авторизовались в HeadHunter</p>
            <p className="text-sm text-muted-foreground">Сейчас вы будете перенаправлены на страницу поиска вакансий</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Ошибка авторизации</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
            <Button onClick={() => router.push("/")}>Вернуться на главную</Button>
          </>
        )}
      </div>
    </div>
  )
}
