"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Check, ChevronRight, Lightbulb, MessageSquare, Play, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock interview questions
const COMMON_QUESTIONS = [
  {
    id: 1,
    question: "Расскажите о себе и своем опыте",
    category: "Общие",
    difficulty: "Легкий",
  },
  {
    id: 2,
    question: "Почему вы хотите работать в нашей компании?",
    category: "Общие",
    difficulty: "Легкий",
  },
  {
    id: 3,
    question: "Какие у вас сильные и слабые стороны?",
    category: "Общие",
    difficulty: "Средний",
  },
  {
    id: 4,
    question: "Расскажите о сложной ситуации на работе и как вы ее решили",
    category: "Поведенческие",
    difficulty: "Средний",
  },
  {
    id: 5,
    question: "Где вы видите себя через 5 лет?",
    category: "Общие",
    difficulty: "Средний",
  },
]

const TECHNICAL_QUESTIONS = [
  {
    id: 6,
    question: "Объясните разницу между let, const и var в JavaScript",
    category: "JavaScript",
    difficulty: "Средний",
  },
  {
    id: 7,
    question: "Что такое замыкания (closures) в JavaScript?",
    category: "JavaScript",
    difficulty: "Сложный",
  },
  {
    id: 8,
    question: "Объясните жизненный цикл компонента в React",
    category: "React",
    difficulty: "Средний",
  },
  {
    id: 9,
    question: "Что такое Virtual DOM и как он работает?",
    category: "React",
    difficulty: "Средний",
  },
  {
    id: 10,
    question: "Объясните разницу между REST и GraphQL",
    category: "Web",
    difficulty: "Сложный",
  },
]

// Mock tips
const INTERVIEW_TIPS = [
  {
    id: 1,
    title: "Подготовьте рассказ о себе",
    description: "Заранее подготовьте краткий (1-2 минуты) рассказ о вашем опыте, навыках и достижениях.",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    id: 2,
    title: "Изучите компанию",
    description: "Исследуйте информацию о компании, ее продуктах, культуре и последних новостях.",
    icon: <Search className="h-5 w-5" />,
  },
  {
    id: 3,
    title: "Подготовьте примеры",
    description:
      "Подготовьте конкретные примеры ваших достижений, используя методику STAR (Ситуация, Задача, Действие, Результат).",
    icon: <Check className="h-5 w-5" />,
  },
  {
    id: 4,
    title: "Подготовьте вопросы",
    description: "Подготовьте несколько вопросов о компании, команде и проектах, чтобы задать их в конце интервью.",
    icon: <BookOpen className="h-5 w-5" />,
  },
]

export default function InterviewPrepPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCommonQuestions = COMMON_QUESTIONS.filter(
    (q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTechnicalQuestions = TECHNICAL_QUESTIONS.filter(
    (q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/50">
      <header className="p-4 flex items-center border-b">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium mx-auto">Подготовка к собеседованию</h1>
      </header>

      <main className="flex-1 p-4">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="relative">
            <Input
              placeholder="Поиск вопросов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>

          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="questions">Вопросы</TabsTrigger>
              <TabsTrigger value="practice">Практика</TabsTrigger>
              <TabsTrigger value="tips">Советы</TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Общие вопросы</h2>
                {filteredCommonQuestions.length > 0 ? (
                  filteredCommonQuestions.map((question) => (
                    <Card key={question.id}>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{question.question}</CardTitle>
                      </CardHeader>
                      <CardFooter className="p-4 pt-2 flex justify-between">
                        <Badge variant="outline">{question.category}</Badge>
                        <Badge
                          variant="outline"
                          className={
                            question.difficulty === "Легкий"
                              ? "border-success-500 text-success-500"
                              : question.difficulty === "Средний"
                                ? "border-warning-500 text-warning-500"
                                : "border-destructive text-destructive"
                          }
                        >
                          {question.difficulty}
                        </Badge>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">Нет результатов</p>
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-medium">Технические вопросы</h2>
                {filteredTechnicalQuestions.length > 0 ? (
                  filteredTechnicalQuestions.map((question) => (
                    <Card key={question.id}>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{question.question}</CardTitle>
                      </CardHeader>
                      <CardFooter className="p-4 pt-2 flex justify-between">
                        <Badge variant="outline">{question.category}</Badge>
                        <Badge
                          variant="outline"
                          className={
                            question.difficulty === "Легкий"
                              ? "border-success-500 text-success-500"
                              : question.difficulty === "Средний"
                                ? "border-warning-500 text-warning-500"
                                : "border-destructive text-destructive"
                          }
                        >
                          {question.difficulty}
                        </Badge>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">Нет результатов</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="practice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Симулятор собеседования</CardTitle>
                  <CardDescription>Практикуйте ответы на вопросы с ИИ-интервьюером</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="AI Interviewer" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">Общее собеседование</p>
                      <p className="text-sm text-muted-foreground">15 минут, 10 вопросов</p>
                    </div>
                    <Button>
                      <Play className="mr-2 h-4 w-4" />
                      Начать
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="AI Interviewer" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">Техническое собеседование</p>
                      <p className="text-sm text-muted-foreground">20 минут, 8 вопросов</p>
                    </div>
                    <Button>
                      <Play className="mr-2 h-4 w-4" />
                      Начать
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="AI Interviewer" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">Поведенческое собеседование</p>
                      <p className="text-sm text-muted-foreground">15 минут, 6 вопросов</p>
                    </div>
                    <Button>
                      <Play className="mr-2 h-4 w-4" />
                      Начать
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Записи собеседований</CardTitle>
                  <CardDescription>Ваши предыдущие практические собеседования</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">У вас пока нет записей собеседований</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tips" className="space-y-4">
              {INTERVIEW_TIPS.map((tip) => (
                <Card key={tip.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">{tip.icon}</div>
                      <CardTitle className="text-base">{tip.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-400/10 border-none">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-primary/20 text-primary">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <CardTitle>Персональные рекомендации</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">
                    Получите персонализированные советы по подготовке к собеседованию на основе вашего резюме и желаемой
                    позиции.
                  </p>
                  <Button className="w-full">
                    Получить рекомендации
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
