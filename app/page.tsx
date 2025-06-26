"use client"

import type React from "react"

import { Suspense, useState } from "react"
import Link from "next/link"
import { ArrowRight, FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import WelcomeAnimation from "@/components/welcome-animation"
import { ThemeToggle } from "@/components/theme-toggle"
import { ResumeUploadDialog } from "@/components/resume-upload-dialog"
import { HHAuthStatus } from "@/components/hh-auth-status"
import { ResumeBuilderChat } from "@/components/resume-builder-chat"

export default function Home() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [isResumeBuilderOpen, setIsResumeBuilderOpen] = useState(false)
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
            <p className="text-lg text-muted-foreground">Бір сипау арқылы арманыңыздағы жұмысты табыңыз</p>
          </div>

          <Button
              className="w-full h-14 text-lg gap-2 bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 border-none"
              onClick={() => setIsResumeBuilderOpen(true)}
            >
              <FileText className="h-5 w-5" />
              Түйіндеме жасаңыз
            </Button>

          <div className="w-full space-y-4">
            <Button className="w-full  h-14 text-lg gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 border-none">
              <label className="flex items-center gap-2 cursor-pointer">
                <Upload className="h-5 w-5" />
                Түйіндемені жүктеп салу
                <input type="file" className="hidden" accept=".pdf,.docx,.doc,.txt" onChange={handleFileChange} />
              </label>
            </Button>

            <HHAuthStatus />

           
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            Резюмеңізді жүктеп салыңыз немесе жеке ұсыныстарды алу үшін HeadHunter қызметіне қосылыңыз
          </p>
        </div>
      </div>

     <ResumeUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        fileName={fileName}
        file={selectedFile}
      />

      <ResumeBuilderChat isOpen={isResumeBuilderOpen} onClose={() => setIsResumeBuilderOpen(false)} />
    </main>
  )
}
