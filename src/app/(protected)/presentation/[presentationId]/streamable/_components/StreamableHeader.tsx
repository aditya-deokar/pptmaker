'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Edit3, Play, Sparkles, CheckCircle2,
  Radio, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreamableHeaderProps {
  isStreaming: boolean
  streamComplete: boolean
  streamStatus: string
  streamProgress: number
  slideCount: number
  activeSlideIdx: number
  presentationId: string
  onBack: () => void
  onOpenEditor: () => void
}

export default function StreamableHeader({
  isStreaming,
  streamComplete,
  streamStatus,
  streamProgress,
  slideCount,
  activeSlideIdx,
  presentationId,
  onBack,
  onOpenEditor,
}: StreamableHeaderProps) {
  return (
    <header className="h-16 flex-shrink-0 border-b border-border/50 bg-background/40 backdrop-blur-3xl flex items-center px-8 gap-8 z-50 relative overflow-hidden shadow-sm">
      {/* Dynamic Background Glow during streaming */}
      <AnimatePresence>
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-0 h-[2px] bg-primary opacity-50"
          />
        )}
      </AnimatePresence>

      {/* Brand & Back */}
      <div className="flex items-center gap-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
           <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_4px_12px_rgba(var(--primary),0.3)]">
             <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
           </div>
           <span className="text-sm font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Verto AI</span>
        </div>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Engine Status */}
      <div className="flex-1 flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            {isStreaming ? (
              <div className="flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </div>
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm" />
            )}
          </div>
          
          <motion.p
            key={streamStatus}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest truncate",
              isStreaming ? "text-primary" : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {isStreaming ? streamStatus : "Ready for Presentation"}
          </motion.p>
        </div>

        {/* Header Progress Bar */}
        {(isStreaming || (streamComplete && streamProgress < 100)) && (
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${streamProgress}%` }}
                transition={{ duration: 0.8, ease: "circOut" }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground w-8">{streamProgress}%</span>
          </div>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {streamComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenEditor}
              className="rounded-full h-8 px-4 text-[11px] font-bold transition-all active:scale-95"
            >
              <Edit3 className="h-3 w-3 mr-1.5 opacity-50" />
              Edit Slides
            </Button>
          </motion.div>
        )}
        
        <Button
          size="sm"
          className="rounded-full h-8 px-4 text-[11px] font-bold shadow-sm transition-all active:scale-95"
        >
          <Play className="h-3 w-3 mr-1.5" />
          Present
        </Button>
      </div>
    </header>
  )
}
