"use client"

import type React from "react"

import { Suspense, useState } from "react"
import Link from "next/link"
import { ArrowRight, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import WelcomeAnimation from "@/components/welcome-animation"
import { ThemeToggle } from "@/components/theme-toggle"
import { ResumeUploadDialog } from "@/components/resume-upload-dialog"
import { HHAuthStatus } from "@/components/hh-auth-status"

export default function Home() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [fileName, setFileName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setSelectedFile(file)
      setIsUploadDialogOpen(true)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 bg-gradient-to-b from-background to-muted/50">
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full flex flex-col items-center space-y-8 text-center">
          <Suspense fallback={<div className="h-32 w-32 animate-pulse rounded-full bg-muted"></div>}>
            <WelcomeAnimation />
          </Suspense>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-primary">JobSwipe</h1>
            <p className="text-lg text-muted-foreground">Найди работу мечты одним свайпом</p>
          </div>

          <div className="w-full space-y-4 pt-6">
            <Button className="w-full h-14 text-lg gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 border-none">
              <label className="flex items-center gap-2 cursor-pointer">
                <Upload className="h-5 w-5" />
                Загрузить резюме
                <input type="file" className="hidden" accept=".pdf,.docx,.doc,.txt" onChange={handleFileChange} />
              </label>
            </Button>

            <HHAuthStatus />

            <Button asChild variant="outline" className="w-full h-14 text-lg gap-2 border-2">
              <Link href="/jobs">
                Начать поиск
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>

            <Button asChild variant="ghost" className="w-full h-14 text-lg">
              <Link href="/settings">Настройки поиска</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            Загрузите резюме или подключите HeadHunter, чтобы получить персонализированные предложения
          </p>
        </div>
      </div>

      <ResumeUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        fileName={fileName}
        file={selectedFile}
      />
    </main>
  )
}
