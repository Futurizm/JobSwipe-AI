"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Search, Clock, Tag, RefreshCw, BookmarkIcon, Eye, Globe } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  category: string
  publishedAt: string
  source: string
  relevanceScore: number
  tags: string[]
  readTime: string
  imageUrl: string
}

const NEWS_CATEGORIES = [
  { id: "all", label: "Все новости", icon: "📰", description: "Смешанные новости по всем категориям" },
  { id: "tech", label: "Технологии", icon: "💻", description: "IT, программирование, инновации" },
  { id: "career", label: "Карьера", icon: "🚀", description: "Рынок труда, HR, развитие" },
  { id: "business", label: "Бизнес", icon: "💼", description: "Экономика, инвестиции, стартапы" },
  { id: "industry", label: "Отрасль", icon: "🏭", description: "Отраслевые новости по вашему профилю" },
  { id: "general", label: "Общие", icon: "🌍", description: "Мировые события, наука, общество" },
]

export default function NewsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [savedNews, setSavedNews] = useState<string[]>([])
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [resumeData, setResumeData] = useState<any>(null)
  const [isPersonalized, setIsPersonalized] = useState(false)

  // Load resume data from localStorage
  useEffect(() => {
    const storedResumeData = localStorage.getItem("resumeData")
    if (storedResumeData) {
      try {
        const parsed = JSON.parse(storedResumeData)
        setResumeData(parsed)
      } catch (error) {
        console.error("Error parsing resume data:", error)
      }
    }
  }, [])

  // Load news based on resume and category
  const loadNews = useCallback(
    async (category = selectedCategory, page = 1) => {
      setLoading(true)

      try {
        const response = await fetch("/api/news/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeData,
            category,
            page,
            limit: 8, // 8 news articles per page
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch news")
        }

        const result = await response.json()

        if (result.success) {
          setNews(result.news)
          setTotalPages(result.totalPages)
          setCurrentPage(result.currentPage)
          setIsPersonalized(result.personalized || false)

          if (!result.fallback) {
            const categoryName = NEWS_CATEGORIES.find(cat => cat.id === category)?.label || "новости"
            toast({
              title: "Новости загружены",
              description: `Найдено ${result.news.length} ${categoryName.toLowerCase()} ${result.personalized ? "по вашему профилю" : ""}`,
            })
          }
        } else {
          throw new Error(result.error || "Failed to load news")
        }
      } catch (error: any) {
        console.error("Error loading news:", error)
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить новости. Попробуйте позже.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [resumeData, selectedCategory, toast],
  )

  // Load news on component mount and when category changes
  useEffect(() => {
    loadNews()
  }, [loadNews])

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    loadNews(category, 1)
  }

  // Handle search
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      // Filter news by search query
      const filtered = news.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setNews(filtered)
    } else {
      loadNews()
    }
  }, [searchQuery, news, loadNews])

  // Handle Enter key in search
  const handleSearchKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearch()
      }
    },
    [handleSearch],
  )

  // Toggle save news
  const toggleSaveNews = (id: string) => {
    const updated = savedNews.includes(id) ? savedNews.filter((newsId) => newsId !== id) : [...savedNews, id]

    setSavedNews(updated)
    localStorage.setItem("savedNews", JSON.stringify(updated))

    toast({
      title: savedNews.includes(id) ? "Удалено из сохраненных" : "Добавлено в сохраненные",
      description: savedNews.includes(id) ? "Новость удалена из сохраненных" : "Новость добавлена в сохраненные",
    })
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Вчера"
    if (diffDays <= 7) return `${diffDays} дней назад`
    return date.toLocaleDateString("ru-RU")
  }

  // Get relevance color
  const getRelevanceColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50"
    if (score >= 80) return "text-blue-600 bg-blue-50"
    if (score >= 70) return "text-yellow-600 bg-yellow-50"
    return "text-gray-600 bg-gray-50"
  }

  // Load saved news from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("savedNews")
    if (saved) {
      try {
        setSavedNews(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading saved news:", error)
      }
    }
  }, [])

  // Filter news based on search query
  const filteredNews = news.filter((article) => {
    if (!searchQuery) return true

    return (
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      article.source.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Get current category info
  const currentCategory = NEWS_CATEGORIES.find(cat => cat.id === selectedCategory)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/50 pt-4 px-4 pb-20">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Новости</h1>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {currentCategory?.description || "Персонализированные новости"}
            </p>
            {isPersonalized && selectedCategory !== "general" && (
              <div className="flex items-center justify-center gap-1 text-xs text-blue-600">
                <Globe className="h-3 w-3" />
                <span>Персонализировано под ваш профиль</span>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Поиск новостей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 -mx-1 px-1">
          {NEWS_CATEGORIES.map((category) => (
            <Badge
              key={category.id}
              variant="outline"
              className={cn(
                "px-3 py-1 cursor-pointer whitespace-nowrap transition-colors",
                selectedCategory === category.id && "bg-primary text-primary-foreground",
              )}
              onClick={() => handleCategoryChange(category.id)}
              title={category.description}
            >
              <span className="mr-1">{category.icon}</span>
              {category.label}
            </Badge>
          ))}
        </div>

        {/* News List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNews.length > 0 ? (
            filteredNews.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base leading-tight">{article.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>{article.source}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(article.publishedAt)}
                        </span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {selectedCategory !== "general" && (
                        <Badge className={cn("text-xs", getRelevanceColor(article.relevanceScore))}>
                          {article.relevanceScore}%
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleSaveNews(article.id)}
                      >
                        <BookmarkIcon className={cn("h-4 w-4", savedNews.includes(article.id) && "fill-current")} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{article.summary}</p>

                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      {article.category}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setSelectedArticle(article)}>
                      <Eye className="h-3 w-3 mr-1" />
                      Читать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="font-medium text-lg mb-1">Новости не найдены</h3>
              <p className="text-muted-foreground mb-4">
                Попробуйте изменить параметры поиска или выбрать другую категорию
              </p>
              <Button onClick={() => loadNews()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => loadNews(selectedCategory, currentPage - 1)}
            >
              Назад
            </Button>
            <span className="flex items-center px-3 text-sm">
              {currentPage} из {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => loadNews(selectedCategory, currentPage + 1)}
            >
              Далее
            </Button>
          </div>
        )}
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-start">
              <div className="flex-1">
                <h2 className="font-bold text-lg leading-tight">{selectedArticle.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedArticle.source} • {formatDate(selectedArticle.publishedAt)}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(null)}>
                ×
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{selectedArticle.content}</p>
            </div>
            <div className="p-4 border-t flex justify-between">
              {selectedCategory !== "general" && (
                <Badge className={getRelevanceColor(selectedArticle.relevanceScore)}>
                  Релевантность: {selectedArticle.relevanceScore}%
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedArticle(null)}>
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}