"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Filter, MapPin, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

const CITIES = [
  "Алматы",
  "Астана",
  "Нур-Султан",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Тараз",
  "Павлодар",
  "Усть-Каменогорск",
  "Семей",
  "Атырау",
  "Костанай",
  "Кызылорда",
  "Уральск",
  "Петропавловск",
  "Актау",
  "Темиртау",
  "Туркестан",
  "Кокшетау",
  "Талдыкорган",
  "Экибастуз",
]

const CATEGORIES = [
  "IT, интернет, телеком",
  "Маркетинг, реклама, PR",
  "Продажи",
  "Административный персонал",
  "Бухгалтерия, финансы",
  "Транспорт, логистика",
  "Производство",
  "Строительство",
  "Медицина, фармацевтика",
  "Образование, наука",
]

const EXPERIENCE_LEVELS = ["Без опыта", "1-3 года", "3-6 лет", "Более 6 лет"]

const EMPLOYMENT_TYPES = [
  "Полная занятость",
  "Частичная занятость",
  "Проектная работа",
  "Стажировка",
  "Удаленная работа",
]

export default function SettingsPage() {
  const router = useRouter()
  const [salaryRange, setSalaryRange] = useState([50000, 200000])
  const [selectedCity, setSelectedCity] = useState<string>("Москва")
  const [selectedCategory, setSelectedCategory] = useState<string>("IT, интернет, телеком")
  const [selectedExperience, setSelectedExperience] = useState<string>("1-3 года")
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([
    "Полная занятость",
    "Удаленная работа",
  ])
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false)
  const [skills, setSkills] = useState<string[]>(["React", "TypeScript", "JavaScript"])
  const [newSkill, setNewSkill] = useState<string>("")

  const handleAddSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const handleToggleEmploymentType = (type: string) => {
    if (selectedEmploymentTypes.includes(type)) {
      setSelectedEmploymentTypes(selectedEmploymentTypes.filter((t) => t !== type))
    } else {
      setSelectedEmploymentTypes([...selectedEmploymentTypes, type])
    }
  }

  const handleSaveSettings = () => {
    // Save city preference to localStorage
    localStorage.setItem("userCity", selectedCity)

    // Save other settings as needed
    const settings = {
      city: selectedCity,
      salaryRange,
      category: selectedCategory,
      experience: selectedExperience,
      employmentTypes: selectedEmploymentTypes,
      remoteOnly,
      skills,
    }

    localStorage.setItem("userSettings", JSON.stringify(settings))

    // Navigate back to the search page
    router.push("/jobs")
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/50">
      <header className="p-4 flex items-center border-b">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium mx-auto">Настройки поиска</h1>
      </header>

      <main className="flex-1 p-4">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-medium">Местоположение</h2>
            </div>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите город" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch id="remote-only" checked={remoteOnly} onCheckedChange={setRemoteOnly} />
              <Label htmlFor="remote-only">Только удаленная работа</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-medium">Фильтры</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="category">
                <AccordionTrigger>Категория</AccordionTrigger>
                <AccordionContent>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="salary">
                <AccordionTrigger>Зарплата</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>{salaryRange[0].toLocaleString()} ₽</span>
                      <span>{salaryRange[1].toLocaleString()} ₽</span>
                    </div>
                    <Slider value={salaryRange} min={0} max={500000} step={5000} onValueChange={setSalaryRange} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="experience">
                <AccordionTrigger>Опыт работы</AccordionTrigger>
                <AccordionContent>
                  <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите опыт" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="employment">
                <AccordionTrigger>Тип занятости</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {EMPLOYMENT_TYPES.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Switch
                          id={`employment-${type}`}
                          checked={selectedEmploymentTypes.includes(type)}
                          onCheckedChange={() => handleToggleEmploymentType(type)}
                        />
                        <Label htmlFor={`employment-${type}`}>{type}</Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="skills">
                <AccordionTrigger>Навыки</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Добавить навык"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                      />
                      <Button variant="outline" onClick={handleAddSkill}>
                        Добавить
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="px-2 py-1">
                          {skill}
                          <button
                            className="ml-1 text-muted-foreground hover:text-foreground"
                            onClick={() => handleRemoveSkill(skill)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <Button
            className="w-full h-12 mt-6 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 border-none"
            onClick={handleSaveSettings}
          >
            <Save className="mr-2 h-4 w-4" />
            Сохранить настройки
          </Button>
        </div>
      </main>
    </div>
  )
}
