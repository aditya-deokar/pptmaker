'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Slide, Theme } from '@/lib/types'
import { resolveThemeTokens } from '@/lib/themeUtils'
import { MasterRecursiveComponent } from '../../_components/editor/MasterRecursiveComponent'
import { Sparkles, Loader2, MousePointerClick } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Canvas constants
const SLIDE_WIDTH = 1280
const SLIDE_HEIGHT = 720

interface StreamableSlidePreviewProps {
  activeSlide: Slide | null
  scale: number
  isStreaming: boolean
  streamStatus: string
  currentTheme: Theme | null
  onNavigateCreate: () => void
}

export default function StreamableSlidePreview({
  activeSlide,
  scale,
  isStreaming,
  streamStatus,
  currentTheme,
  onNavigateCreate,
}: StreamableSlidePreviewProps) {
  const tokens = currentTheme ? resolveThemeTokens(currentTheme) : null

  return (
    <AnimatePresence mode="wait">
      {activeSlide ? (
        <motion.div
          key={activeSlide.id}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{
            duration: 0.45,
            type: 'spring',
            stiffness: 200,
            damping: 25,
          }}
          className="flex-shrink-0 relative"
          style={{
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
          }}
        >
          {/* Outer glow */}
          <div
            className="absolute -inset-3 rounded-2xl opacity-30 blur-xl transition-opacity duration-500"
            style={{
              background: currentTheme?.accentColor
                ? `radial-gradient(ellipse at center, ${currentTheme.accentColor}40, transparent 70%)`
                : 'radial-gradient(ellipse at center, rgba(139,92,246,0.15), transparent 70%)',
            }}
          />

          {/* Slide container */}
          <div
            className="w-full h-full relative overflow-hidden rounded-sm"
            style={{
              backgroundImage: currentTheme?.gradientBackground,
              backgroundColor: currentTheme?.slideBackgroundColor || '#fff',
              color: currentTheme?.fontColor || '#000',
              fontFamily: tokens?.headingFontFamily,
              borderRadius: tokens?.borderRadius || '8px',
              boxShadow: `
                0 0 0 1px rgba(0,0,0,0.06),
                0 4px 16px -2px rgba(0,0,0,0.12),
                0 12px 48px -8px rgba(0,0,0,0.18)
              `,
            }}
          >
            {/* Slide content */}
            <div className="h-full w-full overflow-hidden p-6 sm:p-8 md:p-12">
              <div className="h-full w-full overflow-y-auto">
                <MasterRecursiveComponent
                  content={activeSlide.content}
                  isPreview={true}
                  slideId={activeSlide.id}
                  isEditable={false}
                  onContentChange={() => {}}
                />
              </div>
            </div>

            {/* "Just appeared" entrance flash */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0.15 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                background: `linear-gradient(135deg, ${currentTheme?.accentColor || '#8b5cf6'}20, transparent)`,
              }}
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center gap-6 text-center max-w-sm"
        >
          {isStreaming ? (
            <>
              {/* Streaming but no slide yet — orbital animation */}
              <div className="relative w-24 h-24">
                {/* Outer ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                {/* Middle ring */}
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-dashed border-primary/20"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                />
                {/* Core */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </motion.div>

                {/* Orbiting dots */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-primary"
                    style={{ top: '50%', left: '50%' }}
                    animate={{
                      x: [
                        Math.cos((i * 2 * Math.PI) / 3) * 44,
                        Math.cos((i * 2 * Math.PI) / 3 + Math.PI) * 44,
                        Math.cos((i * 2 * Math.PI) / 3 + 2 * Math.PI) * 44,
                      ],
                      y: [
                        Math.sin((i * 2 * Math.PI) / 3) * 44,
                        Math.sin((i * 2 * Math.PI) / 3 + Math.PI) * 44,
                        Math.sin((i * 2 * Math.PI) / 3 + 2 * Math.PI) * 44,
                      ],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 0.4,
                    }}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-lg font-semibold">Crafting your presentation...</p>
                <motion.p
                  key={streamStatus}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-muted-foreground"
                >
                  {streamStatus}
                </motion.p>
              </div>

              {/* Typing dots */}
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/40"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                <MousePointerClick className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-muted-foreground">No slides yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Start a generation to see your slides build in real-time
                </p>
              </div>
              <Button
                variant="outline"
                onClick={onNavigateCreate}
                className="rounded-xl"
              >
                Create Presentation
              </Button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
