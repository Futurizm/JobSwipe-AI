"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type TelegramUser, getTelegramUser, initTelegramWebApp, isTelegramWebApp } from "@/lib/telegram"

interface TelegramContextType {
  isInTelegram: boolean
  user: TelegramUser | null
  isInitialized: boolean
}

const TelegramContext = createContext<TelegramContextType>({
  isInTelegram: false,
  user: null,
  isInitialized: false,
})

export function useTelegram() {
  return useContext(TelegramContext)
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isInTelegram, setIsInTelegram] = useState(false)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Проверяем, запущено ли приложение в Telegram
    const inTelegram = isTelegramWebApp()
    setIsInTelegram(inTelegram)

    if (inTelegram) {
      // Инициализируем Telegram WebApp
      initTelegramWebApp(() => {
        // Получаем данные пользователя
        const telegramUser = getTelegramUser()
        setUser(telegramUser)
        setIsInitialized(true)
      })
    } else {
      setIsInitialized(true)
    }
  }, [])

  return <TelegramContext.Provider value={{ isInTelegram, user, isInitialized }}>{children}</TelegramContext.Provider>
}
