import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Google API Key
const GOOGLE_API_KEY = "AIzaSyCLIB1yGy-lyyXbyWr5mebsmC46GCHx6Dk"

// Initialize the Google Generative AI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)

// Coursera API configuration
const COURSERA_API_BASE = "https://api.coursera.org/api/courses.v1"
const COURSERA_PARTNER_API = "https://api.coursera.org/api/partners.v1"

// Function to search courses on Coursera
async function searchCourseraAPI(query: string, limit = 20): Promise<any[]> {
  try {
    // Note: Coursera API requires authentication, but for demo purposes we'll use mock data
    // In production, you would need to register for Coursera API access

    const searchUrl = `${COURSERA_API_BASE}/courses?q=search&query=${encodeURIComponent(query)}&limit=${limit}&fields=name,description,photoUrl,workload,averageRating,ratingCount,enrollmentCount,partners.v1(name,logo),instructors.v1(fullName),categories.v1(name)`

    // For now, we'll simulate API response with realistic data
    // In production, replace this with actual API call:
    // const response = await fetch(searchUrl, { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } })

    return generateMockCourseraData(query, limit)
  } catch (error) {
    console.error("Error searching Coursera API:", error)
    return []
  }
}

// Generate realistic mock data based on search query
function generateMockCourseraData(query: string, limit: number): any[] {
  const courses = []
  const queryLower = query.toLowerCase()

  // Programming courses
  if (queryLower.includes("javascript") || queryLower.includes("react") || queryLower.includes("frontend")) {
    courses.push(
      {
        id: "javascript-basics",
        name: "JavaScript for Beginners",
        description: "Learn the fundamentals of JavaScript programming language",
        photoUrl: "/placeholder.svg?height=200&width=400",
        workload: "4-6 hours/week",
        averageRating: 4.7,
        ratingCount: 12543,
        enrollmentCount: 125000,
        partner: { name: "University of Michigan", logo: "/placeholder.svg?height=50&width=50" },
        instructors: [{ fullName: "Dr. Charles Severance" }],
        categories: [{ name: "Computer Science" }],
        level: "Beginner",
        duration: "6 weeks",
        language: "English",
        subtitles: ["Russian", "English"],
        certificate: true,
      },
      {
        id: "react-specialization",
        name: "React Specialization",
        description: "Master React.js and build modern web applications",
        photoUrl: "/placeholder.svg?height=200&width=400",
        workload: "5-7 hours/week",
        averageRating: 4.8,
        ratingCount: 8934,
        enrollmentCount: 89000,
        partner: { name: "Meta", logo: "/placeholder.svg?height=50&width=50" },
        instructors: [{ fullName: "Taught by Meta Staff" }],
        categories: [{ name: "Web Development" }],
        level: "Intermediate",
        duration: "8 weeks",
        language: "English",
        subtitles: ["Russian", "English"],
        certificate: true,
      },
    )
  }

  // Python courses
  if (queryLower.includes("python") || queryLower.includes("data") || queryLower.includes("machine learning")) {
    courses.push(
      {
        id: "python-for-everybody",
        name: "Python for Everybody Specialization",
        description: "Learn to Program and Analyze Data with Python",
        photoUrl: "/placeholder.svg?height=200&width=400",
        workload: "4-6 hours/week",
        averageRating: 4.8,
        ratingCount: 45678,
        enrollmentCount: 456000,
        partner: { name: "University of Michigan", logo: "/placeholder.svg?height=50&width=50" },
        instructors: [{ fullName: "Dr. Charles Severance" }],
        categories: [{ name: "Computer Science" }],
        level: "Beginner",
        duration: "8 weeks",
        language: "English",
        subtitles: ["Russian", "English"],
        certificate: true,
      },
      {
        id: "machine-learning-course",
        name: "Machine Learning Course",
        description: "Learn Machine Learning algorithms and techniques",
        photoUrl: "/placeholder.svg?height=200&width=400",
        workload: "6-8 hours/week",
        averageRating: 4.9,
        ratingCount: 23456,
        enrollmentCount: 234000,
        partner: { name: "Stanford University", logo: "/placeholder.svg?height=50&width=50" },
        instructors: [{ fullName: "Andrew Ng" }],
        categories: [{ name: "Data Science" }],
        level: "Intermediate",
        duration: "11 weeks",
        language: "English",
        subtitles: ["Russian", "English"],
        certificate: true,
      },
    )
  }

  // Design courses
  if (queryLower.includes("design") || queryLower.includes("ui") || queryLower.includes("ux")) {
    courses.push({
      id: "ui-ux-design",
      name: "UI/UX Design Specialization",
      description: "Learn to design user interfaces and user experiences",
      photoUrl: "/placeholder.svg?height=200&width=400",
      workload: "3-5 hours/week",
      averageRating: 4.6,
      ratingCount: 15678,
      enrollmentCount: 156000,
      partner: { name: "California Institute of the Arts", logo: "/placeholder.svg?height=50&width=50" },
      instructors: [{ fullName: "Roman Jaster" }],
      categories: [{ name: "Arts and Humanities" }],
      level: "Beginner",
      duration: "6 weeks",
      language: "English",
      subtitles: ["Russian", "English"],
      certificate: true,
    })
  }

  // Business courses
  if (queryLower.includes("business") || queryLower.includes("management") || queryLower.includes("marketing")) {
    courses.push({
      id: "digital-marketing",
      name: "Digital Marketing Specialization",
      description: "Master digital marketing strategies and tools",
      photoUrl: "/placeholder.svg?height=200&width=400",
      workload: "4-6 hours/week",
      averageRating: 4.5,
      ratingCount: 18934,
      enrollmentCount: 189000,
      partner: { name: "University of Illinois", logo: "/placeholder.svg?height=50&width=50" },
      instructors: [{ fullName: "Aric Rindfleisch" }],
      categories: [{ name: "Business" }],
      level: "Beginner",
      duration: "7 weeks",
      language: "English",
      subtitles: ["Russian", "English"],
      certificate: true,
    })
  }

  // Cooking courses
  if (
    queryLower.includes("cooking") ||
    queryLower.includes("culinary") ||
    queryLower.includes("повар") ||
    queryLower.includes("кулинария")
  ) {
    courses.push(
      {
        id: "culinary-arts",
        name: "Introduction to Culinary Arts",
        description: "Learn fundamental cooking techniques and food preparation",
        photoUrl: "/placeholder.svg?height=200&width=400",
        workload: "3-4 hours/week",
        averageRating: 4.4,
        ratingCount: 5678,
        enrollmentCount: 56000,
        partner: { name: "Culinary Institute of America", logo: "/placeholder.svg?height=50&width=50" },
        instructors: [{ fullName: "Chef Michael Laiskonis" }],
        categories: [{ name: "Personal Development" }],
        level: "Beginner",
        duration: "5 weeks",
        language: "English",
        subtitles: ["Russian", "English"],
        certificate: true,
      },
      {
        id: "food-science",
        name: "The Science of Cooking",
        description: "Understand the science behind cooking and food preparation",
        photoUrl: "/placeholder.svg?height=200&width=400",
        workload: "4-5 hours/week",
        averageRating: 4.7,
        ratingCount: 8934,
        enrollmentCount: 89000,
        partner: { name: "Harvard University", logo: "/placeholder.svg?height=50&width=50" },
        instructors: [{ fullName: "Dr. Ali Bouzari" }],
        categories: [{ name: "Physical Science and Engineering" }],
        level: "Intermediate",
        duration: "6 weeks",
        language: "English",
        subtitles: ["Russian", "English"],
        certificate: true,
      },
    )
  }

  return courses.slice(0, limit)
}

// Function to translate course data to Russian
async function translateCourseData(courses: any[]): Promise<any[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const translatedCourses = await Promise.all(
      courses.map(async (course) => {
        try {
          const prompt = `
            Translate the following course information to Russian. Return ONLY a JSON object with the translated fields:
            
            {
              "name": "Translate course name to Russian",
              "description": "Translate description to Russian",
              "partnerName": "Translate university/partner name to Russian if it's a well-known institution, otherwise keep original",
              "categoryName": "Translate category to Russian",
              "instructorName": "Keep instructor name as is"
            }
            
            Course data:
            Name: ${course.name}
            Description: ${course.description}
            Partner: ${course.partner.name}
            Category: ${course.categories[0]?.name || "General"}
            Instructor: ${course.instructors[0]?.fullName || "Unknown"}
          `

          const result = await model.generateContent(prompt)
          const response = await result.response
          let translatedData = response.text().trim()

          // Clean the response
          if (translatedData.startsWith("```json")) {
            translatedData = translatedData.replace(/```json\n?/, "").replace(/\n?```$/, "")
          } else if (translatedData.startsWith("```")) {
            translatedData = translatedData.replace(/```\n?/, "").replace(/\n?```$/, "")
          }

          const translated = JSON.parse(translatedData)

          return {
            ...course,
            name: translated.name || course.name,
            description: translated.description || course.description,
            partner: {
              ...course.partner,
              name: translated.partnerName || course.partner.name,
            },
            categories: [
              {
                name: translated.categoryName || course.categories[0]?.name || "Общее",
              },
            ],
            instructors: [
              {
                fullName: translated.instructorName || course.instructors[0]?.fullName || "Неизвестно",
              },
            ],
          }
        } catch (error) {
          console.error("Error translating course:", error)
          return course // Return original if translation fails
        }
      }),
    )

    return translatedCourses
  } catch (error) {
    console.error("Error in translation process:", error)
    return courses // Return original courses if translation fails
  }
}

export async function POST(request: NextRequest) {
  try {
    const { resumeData, searchQuery, limit = 20 } = await request.json()

    if (!resumeData && !searchQuery) {
      return NextResponse.json({ error: "Resume data or search query is required" }, { status: 400 })
    }

    let searchTerms: string[] = []

    // Extract search terms from resume data
    if (resumeData) {
      // Add skills
      if (resumeData.skills && Array.isArray(resumeData.skills)) {
        searchTerms.push(...resumeData.skills.slice(0, 5)) // Top 5 skills
      }

      // Add experience-based terms
      if (resumeData.experience && Array.isArray(resumeData.experience)) {
        resumeData.experience.forEach((exp: any) => {
          if (exp.position) {
            searchTerms.push(exp.position)
          }
        })
      }

      // Add education-based terms
      if (resumeData.education && Array.isArray(resumeData.education)) {
        resumeData.education.forEach((edu: any) => {
          if (edu.degree) {
            searchTerms.push(edu.degree)
          }
        })
      }
    }

    // Add manual search query
    if (searchQuery) {
      searchTerms.push(searchQuery)
    }

    // Remove duplicates and empty terms
    searchTerms = [...new Set(searchTerms.filter((term) => term && term.trim().length > 0))]

    if (searchTerms.length === 0) {
      searchTerms = ["programming", "business", "design"] // Default search terms
    }

    // Search for courses using multiple terms
    const allCourses: any[] = []

    for (const term of searchTerms.slice(0, 3)) {
      // Limit to 3 search terms to avoid too many requests
      const courses = await searchCourseraAPI(term, Math.ceil(limit / searchTerms.length))
      allCourses.push(...courses)
    }

    // Remove duplicates based on course ID
    const uniqueCourses = allCourses.filter(
      (course, index, self) => index === self.findIndex((c) => c.id === course.id),
    )

    // Limit results
    const limitedCourses = uniqueCourses.slice(0, limit)

    // Translate courses to Russian
    const translatedCourses = await translateCourseData(limitedCourses)

    // Calculate relevance score based on resume
    const coursesWithRelevance = translatedCourses.map((course) => {
      let relevanceScore = 0

      if (resumeData?.skills) {
        const courseText = `${course.name} ${course.description}`.toLowerCase()
        resumeData.skills.forEach((skill: string) => {
          if (courseText.includes(skill.toLowerCase())) {
            relevanceScore += 10
          }
        })
      }

      return {
        ...course,
        relevanceScore,
        matchPercentage: Math.min(100, Math.max(60, relevanceScore + Math.floor(Math.random() * 20) + 70)),
      }
    })

    // Sort by relevance
    coursesWithRelevance.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return NextResponse.json({
      success: true,
      courses: coursesWithRelevance,
      searchTerms,
      totalFound: coursesWithRelevance.length,
    })
  } catch (error: any) {
    console.error("Error searching courses:", error)
    return NextResponse.json({ error: error.message || "Failed to search courses" }, { status: 500 })
  }
}
