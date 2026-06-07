'use client'

import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Slide, Theme } from '@/lib/types'
import { MasterRecursiveComponent } from '../../_components/editor/MasterRecursiveComponent'

// Canvas constants
const SLIDE_WIDTH = 1280
const SLIDE_HEIGHT = 720
const THUMB_SCALE = 0.12

interface StreamableSidebarProps {
  slides: Slide[]
  activeSlideIdx: number
  isStreaming: boolean
  currentTheme: Theme | null
  onSelectSlide: (idx: number) => void
}

export default function StreamableSidebar({
  slides,
  activeSlideIdx,
  isStreaming,
  currentTheme,
  onSelectSlide,
}: StreamableSidebarProps) {
  const thumbnailRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  useEffect(() => {
    const el = thumbnailRefs.current.get(activeSlideIdx)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeSlideIdx])

  return (
    <aside className="w-56 lg:w-64 h-full border-r border-border bg-card/40 backdrop-blur-3xl flex-shrink-0 flex flex-col relative z-20">
      {/* Sidebar header */}
      <div className="px-5 py-4 border-b border-border bg-muted/10">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Timeline
          </p>
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] text-primary font-bold uppercase tracking-wider">Live</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Thumbnail list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {slides.map((slide, idx) => {
              const isActive = idx === activeSlideIdx;
              return (
                <motion.div
                  key={slide.id || `slide-${idx}`}
                  ref={(el) => { if (el) thumbnailRefs.current.set(idx, el) }}
                  layout
                  initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    delay: idx * 0.04,
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 120,
                    damping: 20,
                  }}
                  onClick={() => onSelectSlide(idx)}
                  className="group cursor-pointer outline-none relative"
                >
                  <div className={cn(
                    "relative aspect-video rounded-xl overflow-hidden border transition-all duration-500",
                    isActive 
                      ? "border-primary shadow-sm ring-1 ring-primary/30 scale-[1.02]"
                      : "border-border bg-muted/10 hover:border-border/80 hover:bg-muted/20"
                  )}>
                    {/* Slide preview content */}
                    <div
                      className="w-full h-full relative"
                      style={{
                        backgroundColor: currentTheme?.slideBackgroundColor || '#0a0a0a',
                        color: currentTheme?.fontColor || '#fff',
                      }}
                    >
                      <div
                        className="absolute inset-0 origin-top-left"
                        style={{
                          transform: `scale(${THUMB_SCALE})`,
                          width: SLIDE_WIDTH,
                          height: SLIDE_HEIGHT,
                        }}
                      >
                        <MasterRecursiveComponent
                          content={slide.content}
                          isPreview={true}
                          slideId={slide.id}
                          isEditable={false}
                          onContentChange={() => {}}
                        />
                      </div>
                      
                      {/* Glass Overlay for non-active */}
                      {!isActive && <div className="absolute inset-0 bg-background/20 transition-colors group-hover:bg-transparent" />}
                    </div>

                    {/* Badge */}
                    <div className={cn(
                      "absolute top-2 left-2 z-20 px-2 py-0.5 rounded-lg text-[9px] font-bold backdrop-blur-md border transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-background/80 text-muted-foreground border-border"
                    )}>
                      {idx + 1}
                    </div>
                  </div>

                  {/* Slide name under thumbnail */}
                  <div className="mt-2 px-1">
                    <p className={cn(
                      "text-[10px] font-medium truncate transition-all duration-300",
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {slide.slideName || `Slide ${idx + 1}`}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Skeleton for next incoming slide */}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-video rounded-xl border border-dashed border-primary/30 bg-primary/5 overflow-hidden flex flex-col items-center justify-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-xl opacity-20 animate-pulse" />
                <Loader2 className="h-5 w-5 animate-spin text-primary relative z-10" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-primary/70 uppercase tracking-widest">Synthesizing</span>
                <div className="flex gap-1">
                   {[0,1,2].map(i => (
                     <motion.div 
                        key={i} 
                        className="w-1 h-1 rounded-full bg-primary/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                     />
                   ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
