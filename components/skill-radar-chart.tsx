"use client"

import { useEffect, useRef } from "react"

interface Skill {
  name: string
  level: number
}

interface SkillRadarChartProps {
  skills: Skill[]
}

export function SkillRadarChart({ skills }: SkillRadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || skills.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1
    const size = 280
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    // Calculate center and radius
    const center = size / 2
    const radius = center - 50

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw background circles (grid)
    const levels = 5
    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)"
    ctx.lineWidth = 1

    for (let i = levels; i > 0; i--) {
      const currentRadius = (radius / levels) * i

      ctx.beginPath()
      ctx.arc(center, center, currentRadius, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Draw axis lines
    const angleStep = (Math.PI * 2) / skills.length
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)"
    ctx.lineWidth = 1

    for (let i = 0; i < skills.length; i++) {
      const angle = i * angleStep - Math.PI / 2
      const x = center + radius * Math.cos(angle)
      const y = center + radius * Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    // Calculate points for each skill
    const points = skills.map((skill, i) => {
      const angle = i * angleStep - Math.PI / 2 // Start from top
      const value = skill.level / 100
      const x = center + radius * value * Math.cos(angle)
      const y = center + radius * value * Math.sin(angle)
      return { x, y, name: skill.name, value, angle }
    })

    // Draw skill polygon with gradient
    if (points.length > 0) {
      // Create gradient
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius)
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)")
      gradient.addColorStop(1, "rgba(59, 130, 246, 0.1)")

      ctx.beginPath()
      ctx.fillStyle = gradient
      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)"
      ctx.lineWidth = 2

      points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })

      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

    // Draw points
    points.forEach((point) => {
      ctx.beginPath()
      ctx.fillStyle = "white"
      ctx.strokeStyle = "rgba(59, 130, 246, 1)"
      ctx.lineWidth = 3
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })

    // Draw labels
    ctx.fillStyle = "rgba(71, 85, 105, 0.8)"
    ctx.font = "12px Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    points.forEach((point, i) => {
      const angle = point.angle
      const labelDistance = radius + 25
      const labelX = center + labelDistance * Math.cos(angle)
      const labelY = center + labelDistance * Math.sin(angle)

      // Adjust text alignment based on position
      if (Math.abs(angle) < Math.PI / 4 || Math.abs(angle - Math.PI) < Math.PI / 4) {
        ctx.textAlign = "center"
      } else if (angle > 0) {
        ctx.textAlign = "left"
      } else {
        ctx.textAlign = "right"
      }

      // Draw skill name
      ctx.fillStyle = "rgba(71, 85, 105, 0.9)"
      ctx.font = "bold 11px Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      ctx.fillText(point.name, labelX, labelY - 6)

      // Draw percentage
      ctx.fillStyle = "rgba(59, 130, 246, 0.8)"
      ctx.font = "10px Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      ctx.fillText(`${Math.round(point.value * 100)}%`, labelX, labelY + 6)
    })

    // Draw center point
    ctx.beginPath()
    ctx.fillStyle = "rgba(59, 130, 246, 0.3)"
    ctx.arc(center, center, 4, 0, Math.PI * 2)
    ctx.fill()
  }, [skills])

  if (skills.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-muted-foreground">
        <p>Нет навыков для отображения</p>
      </div>
    )
  }

  return (
    <div className="flex justify-center p-4">
      <canvas
        ref={canvasRef}
        className="max-w-full rounded-lg"
        style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
      />
    </div>
  )
}
