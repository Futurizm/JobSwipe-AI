"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Briefcase, BookOpen, User, BookmarkIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTelegram } from "./telegram-provider"
import { useEffect } from "react"

export function BottomNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isInTelegram } = useTelegram()

  const navItems = [
    {
      name: "Вакансии",
      href: "/jobs",
      icon: <Briefcase className="h-5 w-5" />,
      active: pathname === "/jobs",
    },
    // {
    //   name: "Новости",
    //   href: "/courses",
    //   icon: <BookOpen className="h-5 w-5" />,
    //   active: pathname === "/courses",
    // },
    {
      name: "Сохраненные",
      href: "/saved",
      icon: <BookmarkIcon className="h-5 w-5" />,
      active: pathname === "/saved",
    },
    {
      name: "Профиль",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
      active: pathname === "/profile",
    },
  ]

  // Настраиваем главную кнопку Telegram при необходимости
  useEffect(() => {
    if (isInTelegram && pathname === "/") {
      // Здесь можно настроить главную кнопку для главной страницы
    }
  }, [isInTelegram, pathname])

  // Не показываем навбар на главной странице
  if (pathname === "/") {
    return null
  }

  return (
    <>
      {/* Добавляем отступ внизу страницы, когда навбар виден */}
      <div className="pb-16" />

      <nav className={cn("bottom-nav", isInTelegram && "telegram-bottom-nav")}>
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} className={cn("bottom-nav-item", item.active && "active")}>
            <div className="bottom-nav-item-icon">{item.icon}</div>
            <span className="bottom-nav-item-text">{item.name}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
