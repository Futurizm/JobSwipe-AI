"use client"

import { useEffect, useState } from "react"
import { getAuthorizationUrl, getStoredToken, getUserInfo, isTokenValid } from "@/lib/headhunter"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, RefreshCw } from "lucide-react"

interface HHAuthStatusProps {
  onLoginSuccess?: () => void
}

export function HHAuthStatus({ onLoginSuccess }: HHAuthStatusProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    setIsLoading(true)

    try {
      if (isTokenValid()) {
        const tokenData = getStoredToken()
        if (tokenData) {
          // Get user info to verify token is working
          const userInfo = await getUserInfo(tokenData.access_token)
          setUserName(userInfo.first_name || userInfo.last_name || "Пользователь HH")
          setIsLoggedIn(true)

          if (onLoginSuccess) {
            onLoginSuccess()
          }
        }
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
      setIsLoggedIn(false)
      setUserName(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = () => {
    window.location.href = getAuthorizationUrl()
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("hh_token")
      setIsLoggedIn(false)
      setUserName(null)
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-full h-14 text-lg gap-2 border-2">
        <RefreshCw className="h-5 w-5 animate-spin" />
        Проверка статуса авторизации
      </Button>
    )
  }

  if (isLoggedIn) {
    return (
      <div className="space-y-2">
        <div className="p-3 bg-success-500/10 rounded-lg text-center">
          <p className="text-sm">
            Вы авторизованы в HeadHunter как <span className="font-medium">{userName}</span>
          </p>
        </div>
        <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Выйти из HeadHunter
        </Button>
      </div>
    )
  }

  return (
    <Button variant="outline" className="w-full h-14 text-lg gap-2 border-2 border-primary" onClick={handleLogin}>
      <LogIn className="h-5 w-5" />
      Подключить HeadHunter
    </Button>
  )
}
