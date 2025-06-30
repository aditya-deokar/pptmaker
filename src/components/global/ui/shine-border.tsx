"use client"

import type React from "react"
import { useRef, useEffect } from "react"

interface ShineBorderProps {
  children: React.ReactNode
  className?: string
  borderClassName?: string
  duration?: number
}

export function ShineBorder({ children, className = "", borderClassName = "", duration = 2000 }: ShineBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = container.getBoundingClientRect()
      const x = (e.clientX - left) / width
      const y = (e.clientY - top) / height

      container.style.setProperty("--mouse-x", `${x * 100}%`)
      container.style.setProperty("--mouse-y", `${y * 100}%`)
    }

    container.addEventListener("mousemove", handleMouseMove)
    return () => container.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`group relative   ${className}`}
      style={{ "--shine-duration": `${duration}ms` } as React.CSSProperties}
    >
      <div className={`absolute inset-0 rounded-xl pointer-events-none  ${borderClassName}`}>
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(
      500px circle at var(--mouse-x) var(--mouse-y),
      var(--gradient-color),
      transparent 50%
    )`,
          }}
        />
      </div>
      {children}
    </div>
  )
}
