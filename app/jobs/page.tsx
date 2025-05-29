"use client";

import type React from "react";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Check,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  getStoredToken,
  getUserResumes,
  applyToVacancy,
  hasAppliedToVacancy,
  getVacancies,
  convertHHVacancyToJob,
} from "@/lib/headhunter";
import { useToast } from "@/hooks/use-toast";
import { JobMatchRadar } from "@/components/job-match-radar";
import { CoverLetterPreview } from "@/components/cover-letter-preview";
import { saveApplication, hasAppliedToVacancyLocal } from "@/lib/applications";

export default function JobsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<string | null>(null);
  const [likedJobs, setLikedJobs] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userResumes, setUserResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [showRadar, setShowRadar] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [resumeSkills, setResumeSkills] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Motion values for the current card
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-350, 0, 350], [-30, 0, 30]);

  // Memoized current job to prevent unnecessary re-renders
  const currentJobData = useMemo(() => {
    return jobs[currentIndex] || null;
  }, [jobs, currentIndex]);

  // Load resume data from localStorage
  useEffect(() => {
    const storedResumeData = localStorage.getItem("resumeData");
    if (storedResumeData) {
      try {
        const resumeData = JSON.parse(storedResumeData);
        if (resumeData.skills && Array.isArray(resumeData.skills)) {
          setResumeSkills(resumeData.skills);
        }
      } catch (error) {
        console.error("Error parsing stored resume data:", error);
      }
    }
  }, []);

  // Fetch jobs and resumes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tokenData = getStoredToken();
        if (tokenData) {
          // Fetch user resumes first
          const resumesResponse = await getUserResumes(tokenData.access_token);
          setUserResumes(resumesResponse.items || []);

          // Set the first published resume as selected
          const publishedResume = resumesResponse.items?.find(
            (resume: any) => resume.status?.id === "published"
          );
          if (publishedResume) {
            setSelectedResumeId(publishedResume.id);
          }

          // Prepare search parameters based on resume skills
          const searchParams: any = { per_page: 20 };

          // If we have resume skills, use them for search
          if (resumeSkills.length > 0) {
            const skillsForSearch = resumeSkills.slice(0, 3).join(" ");
            searchParams.text = skillsForSearch;
          }

          // Fetch vacancies
          const vacanciesResponse = await getVacancies(
            tokenData.access_token,
            searchParams
          );
          const fetchedJobs = vacanciesResponse.items.map(
            convertHHVacancyToJob
          );
          setJobs(fetchedJobs);

          // Check which jobs user has already applied to (both API and local)
          const appliedJobIds: string[] = [];
          for (const job of fetchedJobs) {
            const hasAppliedAPI = await hasAppliedToVacancy(
              tokenData.access_token,
              job.id
            );
            const hasAppliedLocal = hasAppliedToVacancyLocal(job.id);
            if (hasAppliedAPI || hasAppliedLocal) {
              appliedJobIds.push(job.id);
            }
          }
          setAppliedJobs(appliedJobIds);
        } else {
          setJobs(MOCK_JOBS);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setJobs(MOCK_JOBS);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить вакансии. Используем демо-данные.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast, resumeSkills.length]);

  // Handle drag
  const handleDrag = useCallback(
    (_: any, info: { offset: { x: number; y: number } }) => {
      if (isAnimating) return;

      // Show overlay based on direction
      if (info.offset.x > 100) {
        setDirection("right");
      } else if (info.offset.x < -100) {
        setDirection("left");
      } else {
        setDirection(null);
      }
    },
    [isAnimating]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (isAnimating) return;

      const swipeThreshold = 100;
      const velocityThreshold = 0.5;

      if (
        info.offset.x > swipeThreshold ||
        (info.velocity.x > velocityThreshold && info.offset.x > 50)
      ) {
        // Swipe right - like
        handleLike();
      } else if (
        info.offset.x < -swipeThreshold ||
        (info.velocity.x < -velocityThreshold && info.offset.x < -50)
      ) {
        // Swipe left - skip
        handleSkip();
      } else {
        // Reset position
        x.set(0);
        y.set(0);
        setDirection(null);
      }
    },
    [isAnimating]
  );

  const handleLike = useCallback(() => {
    if (currentIndex < jobs.length && !isAnimating) {
      const job = jobs[currentIndex];
      setIsAnimating(true);
      setLikedJobs((prev) => [...prev, job]);

      // Animate card completely off screen to the right
      x.set(window.innerWidth + 100);

      // Wait for animation to complete, then show next card
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        x.set(0);
        y.set(0);
        setDirection(null);
        setIsAnimating(false);
      }, 300);

      // Save application in background
      saveApplication({
        vacancyId: job.id,
        title: job.title,
        company: job.company,
        logo: job.logo,
        salary: job.salary,
        location: job.location,
        description: job.description,
      });

      // Apply to job if authenticated
      const tokenData = getStoredToken();
      if (tokenData && selectedResumeId && !appliedJobs.includes(job.id)) {
        applyToVacancy(tokenData.access_token, job.id, selectedResumeId)
          .then(() => {
            setAppliedJobs((prev) => [...prev, job.id]);
            toast({
              title: "Отклик отправлен",
              description: "Ваш отклик на вакансию успешно отправлен",
            });
          })
          .catch((error: any) => {
            if (
              !error.message?.includes("already_applied") &&
              !error.message?.includes("Доступ запрещен")
            ) {
              console.error("Error applying to vacancy:", error);
            }
          });
      }
    }
  }, [currentIndex, jobs, selectedResumeId, appliedJobs, toast, isAnimating]);

  const handleSkip = useCallback(() => {
    if (currentIndex < jobs.length && !isAnimating) {
      setIsAnimating(true);

      // Animate card completely off screen to the left
      x.set(-(window.innerWidth + 100));

      // Wait for animation to complete, then show next card
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        x.set(0);
        y.set(0);
        setDirection(null);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentIndex, jobs.length, isAnimating]);

  const handleApplyWithCoverLetter = async (coverLetter: string) => {
    if (!selectedResumeId || isApplying || !currentJob) return;

    setIsApplying(true);

    try {
      const tokenData = getStoredToken();
      if (!tokenData) {
        throw new Error("Токен не найден");
      }

      // Check if already applied
      if (appliedJobs.includes(currentJob.id)) {
        toast({
          title: "Уже откликались",
          description: "Вы уже отправляли отклик на эту вакансию",
        });
        return;
      }

      // Apply with custom cover letter
      await applyToVacancy(
        tokenData.access_token,
        currentJob.id,
        selectedResumeId,
        coverLetter
      );

      // Add to applied jobs list
      setAppliedJobs((prev) => [...prev, currentJob.id]);

      // Save application locally
      saveApplication({
        vacancyId: currentJob.id,
        title: currentJob.title,
        company: currentJob.company,
        logo: currentJob.logo,
        salary: currentJob.salary,
        location: currentJob.location,
        description: currentJob.description,
        coverLetter,
      });

      setShowCoverLetter(false);
      toast({
        title: "Отклик отправлен",
        description:
          "Ваш отклик с персонализированным письмом успешно отправлен",
      });
    } catch (error: any) {
      console.error("Error applying to vacancy:", error);
      const errorMessage =
        error.message || "Не удалось отправить отклик на вакансию";

      if (
        errorMessage.includes("already_applied") ||
        errorMessage.includes("Вы уже откликались")
      ) {
        setAppliedJobs((prev) => [...prev, currentJob.id]);
        saveApplication({
          vacancyId: currentJob.id,
          title: currentJob.title,
          company: currentJob.company,
          logo: currentJob.logo,
          salary: currentJob.salary,
          location: currentJob.location,
          description: currentJob.description,
          coverLetter,
        });
        toast({
          title: "Уже откликались",
          description: "Вы уже отправляли отклик на эту вакансию",
        });
      } else {
        toast({
          title: "Ошибка при отправке отклика",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsApplying(false);
    }
  };

  const openVacancyInHH = useCallback(() => {
    if (currentJobData?.alternate_url) {
      window.open(currentJobData.alternate_url, "_blank");
    } else {
      toast({
        title: "Ссылка недоступна",
        description: "Не удалось открыть вакансию на HeadHunter",
        variant: "destructive",
      });
    }
  }, [currentJobData, toast]);

  // Calculate skill match percentage
  const calculateSkillMatch = useCallback(
    (jobSkill: string): number => {
      if (!resumeSkills.length) return Math.floor(Math.random() * 40) + 60;

      const normalizedJobSkill = jobSkill.toLowerCase();
      const normalizedResumeSkills = resumeSkills.map((skill) =>
        skill.toLowerCase()
      );

      if (normalizedResumeSkills.includes(normalizedJobSkill)) {
        return 100;
      }

      for (const resumeSkill of normalizedResumeSkills) {
        if (
          normalizedJobSkill.includes(resumeSkill) ||
          resumeSkill.includes(normalizedJobSkill)
        ) {
          return 85;
        }
      }

      return Math.floor(Math.random() * 40) + 60;
    },
    [resumeSkills]
  );

  // Get match color based on percentage
  const getMatchColor = useCallback((percentage: number) => {
    if (percentage >= 90) return "#10b981";
    if (percentage >= 75) return "#22c55e";
    if (percentage >= 60) return "#f59e0b";
    return "#ef4444";
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/50">
        <header className="p-4 flex items-center border-b">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium mx-auto">Поиск вакансий</h1>
        </header>

        <main className="flex-1 p-4 flex flex-col items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-xl bg-muted w-full h-[70vh] max-w-md"></div>
            <div className="mt-4 flex justify-center gap-4">
              <div className="h-14 w-14 rounded-full bg-muted"></div>
              <div className="h-14 w-14 rounded-full bg-muted"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (currentIndex >= jobs.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="w-full max-w-md space-y-8">
          <div className="p-6 bg-card rounded-lg shadow-lg border">
            <h2 className="text-2xl font-bold mb-4">Вакансии закончились</h2>
            <p className="text-muted-foreground mb-6">
              Вы просмотрели все доступные вакансии. Вам понравилось{" "}
              {likedJobs.length} вакансий.
            </p>

            {likedJobs.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Понравившиеся вакансии:</h3>
                <div className="space-y-2">
                  {likedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={job.logo || "/placeholder.svg"}
                          alt={job.company}
                        />
                        <AvatarFallback>
                          {job.company.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.company}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {job.matchPercentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push("/")}>
                Вернуться на главную
              </Button>
              <Button variant="outline" onClick={() => setCurrentIndex(0)}>
                Начать заново
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentJobData) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/50">
      <header className="p-4 flex items-center border-b">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium mx-auto">Поиск вакансий</h1>
        <Button variant="ghost" size="icon" onClick={() => setShowRadar(true)}>
          <Search className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-1 p-4 flex flex-col">
        <div className="relative w-full max-w-md mx-auto h-[70vh] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="absolute w-full h-full"
              style={{ x, y, rotate, touchAction: "none" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.05 }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3,
              }}
            >
              <div className="w-full h-full bg-card rounded-xl shadow-lg border overflow-hidden">
                {/* Card content */}
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="p-4 flex items-center gap-3 border-b">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage
                        src={currentJobData.logo || "/placeholder.svg"}
                        alt={currentJobData.company}
                      />
                      <AvatarFallback>
                        {currentJobData.company.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="font-bold text-lg">
                        {currentJobData.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {currentJobData.company}
                      </p>
                    </div>

                    {/* Match percentage */}
                    <div
                      className="match-percentage"
                      style={
                        {
                          "--match-percentage": `${currentJobData.matchPercentage}%`,
                          "--match-color": getMatchColor(
                            currentJobData.matchPercentage
                          ),
                        } as React.CSSProperties
                      }
                    >
                      <span className="match-percentage-text">
                        {currentJobData.matchPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3" />
                        {currentJobData.location}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <DollarSign className="h-3 w-3" />
                        {currentJobData.salary}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Briefcase className="h-3 w-3" />
                        {currentJobData.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {currentJobData.experience}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Описание</h3>
                      <p className="text-sm text-muted-foreground">
                        {currentJobData.description}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Требуемые навыки</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentJobData.requirements.map(
                          (skill: string, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className={cn(
                                resumeSkills.some(
                                  (s) =>
                                    s.toLowerCase() === skill.toLowerCase() ||
                                    s
                                      .toLowerCase()
                                      .includes(skill.toLowerCase()) ||
                                    skill
                                      .toLowerCase()
                                      .includes(s.toLowerCase())
                                ) && "bg-primary/20 text-primary"
                              )}
                            >
                              {skill}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Соответствие навыков</h3>
                      <div className="space-y-2">
                        {currentJobData.requirements.map(
                          (skill: string, index: number) => {
                            const skillMatch = calculateSkillMatch(skill);
                            return (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{skill}</span>
                                  <span>{skillMatch}%</span>
                                </div>
                                <Progress value={skillMatch} className="h-2" />
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={openVacancyInHH}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Открыть в HH
                      </Button>
                      <Button
                        className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
                        onClick={() => {
                          setCurrentJob(currentJobData);
                          setShowCoverLetter(true);
                        }}
                        disabled={appliedJobs.includes(currentJobData.id)}
                      >
                        {appliedJobs.includes(currentJobData.id) ? (
                          <>
                            <Check className="h-4 w-4" />
                            Откликнулись
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Отклик
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Overlay for like/dislike */}
                <div
                  className={cn(
                    "swipe-card-overlay swipe-card-overlay-like",
                    direction === "right" && "active"
                  )}
                >
                  <div className="border-4 border-success-500 rounded-full p-2">
                    <Check className="h-8 w-8" />
                  </div>
                </div>
                <div
                  className={cn(
                    "swipe-card-overlay swipe-card-overlay-nope",
                    direction === "left" && "active"
                  )}
                >
                  <div className="border-4 border-destructive rounded-full p-2">
                    <X className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full border-2 border-destructive hover:bg-destructive/10"
            onClick={handleSkip}
            disabled={isAnimating}
          >
            <X className="h-6 w-6 text-destructive" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full border-2 border-success-500 hover:bg-success-500/10"
            onClick={handleLike}
            disabled={isAnimating}
          >
            <Check className="h-6 w-6 text-success-500" />
          </Button>
        </div>
      </main>

      {/* Job Match Radar */}
      <JobMatchRadar isOpen={showRadar} onClose={() => setShowRadar(false)} />

      {/* Cover Letter Preview */}
      {currentJob && (
        <CoverLetterPreview
          isOpen={showCoverLetter}
          onClose={() => setShowCoverLetter(false)}
          onApply={handleApplyWithCoverLetter}
          job={currentJob}
          isApplying={isApplying}
        />
      )}
    </div>
  );
}

// Mock data for job cards if API fails
const MOCK_JOBS = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "TechCorp",
    location: "Москва",
    salary: "150 000 - 200 000 ₽",
    description:
      "Мы ищем опытного Frontend разработчика для создания современных веб-приложений. Вы будете работать с React, TypeScript и современными инструментами разработки.",
    requirements: ["React", "TypeScript", "CSS", "HTML", "Git"],
    matchPercentage: 92,
    logo: "/placeholder.svg?height=80&width=80",
    type: "Полная занятость",
    experience: "3-5 лет",
    alternate_url: "https://hh.ru/vacancy/123456",
  },
  {
    id: "2",
    title: "UX/UI Designer",
    company: "DesignStudio",
    location: "Санкт-Петербург",
    salary: "120 000 - 180 000 ₽",
    description:
      "Требуется талантливый UX/UI дизайнер для создания интуитивных и красивых интерфейсов. Вы будете работать над проектами для крупных клиентов.",
    requirements: ["Figma", "Adobe XD", "Prototyping", "User Research"],
    matchPercentage: 85,
    logo: "/placeholder.svg?height=80&width=80",
    type: "Полная занятость",
    experience: "2-4 года",
    alternate_url: "https://hh.ru/vacancy/123457",
  },
  {
    id: "3",
    title: "Backend Developer",
    company: "ServerPro",
    location: "Удаленно",
    salary: "180 000 - 250 000 ₽",
    description:
      "Ищем Backend разработчика для создания высоконагруженных систем. Вы будете работать с Node.js, MongoDB и AWS.",
    requirements: ["Node.js", "MongoDB", "AWS", "Express", "REST API"],
    matchPercentage: 78,
    logo: "/placeholder.svg?height=80&width=80",
    type: "Полная занятость",
    experience: "4-6 лет",
    alternate_url: "https://hh.ru/vacancy/123458",
  },
];
