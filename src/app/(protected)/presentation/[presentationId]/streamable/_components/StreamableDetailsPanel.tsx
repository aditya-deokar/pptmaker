'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2, Edit3, Palette, Layers,
  Clock, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Slide, Theme } from '@/lib/types'

interface StreamableDetailsPanelProps {
  activeSlide: Slide | null
  slides: Slide[]
  isStreaming: boolean
  streamComplete: boolean
  currentTheme: Theme | null
  presentationId: string
  onOpenEditor: () => void
}

export default function StreamableDetailsPanel({
  activeSlide,
  slides,
  isStreaming,
  streamComplete,
  currentTheme,
  presentationId,
  onOpenEditor,
}: StreamableDetailsPanelProps) {
  return (
    <aside className="w-64 xl:w-72 h-full border-l border-border/50 bg-background/40 backdrop-blur-3xl flex-shrink-0 flex flex-col relative z-20 shadow-[-8px_0_32px_-8px_rgba(0,0,0,0.05)]">
      {/* Panel header */}
      <div className="px-6 py-5 border-b border-border/50 bg-muted/5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Inspect
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {/* Active slide info */}
          <AnimatePresence mode='wait'>
            {activeSlide && (
              <motion.div
                key={activeSlide.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Slide Name</span>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {activeSlide.slideName || 'Untitled Slide'}
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Properties</span>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-muted/10 border border-border">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Sparkles className="h-3 w-3" />
                        <span>Layout</span>
                      </div>
                      <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                        {activeSlide.type || 'standard'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Engine */}
          <div className="space-y-4 pt-2">
             <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Engine Status</span>
            
            <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 border border-border/50 space-y-4 shadow-sm relative overflow-hidden">
               {/* Decorative glow */}
               <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full blur-xl pointer-events-none" />
               <div className="flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-2.5">
                   {isStreaming ? (
                     <div className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                     </div>
                   ) : (
                     <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                   )}
                   <span className={cn(
                     "text-[11px] font-bold tracking-wide uppercase",
                     isStreaming ? "text-primary" : "text-emerald-600 dark:text-emerald-500"
                   )}>
                     {isStreaming ? "Synthesizing" : "Operational"}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono border-border text-muted-foreground">
                    v2.1
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                   <span className="text-muted-foreground">Throughput</span>
                   <span className="text-foreground font-mono">{slides.length} nodes</span>
                </div>
             </div>
          </div>

          {/* Style Configuration */}
          {currentTheme && (
            <div className="space-y-4 pt-2">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Visual Identity</span>
              
              <div className="p-4 rounded-2xl bg-muted/10 border border-border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1.5">
                    {[currentTheme.accentColor, currentTheme.slideBackgroundColor, currentTheme.fontColor].map((c, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-foreground">{currentTheme.name}</span>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-tighter">System Preset</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-background/50 border border-border">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Palette className="h-3 w-3" />
                    <span>Typography</span>
                  </div>
                  <span className="text-[10px] font-medium text-foreground">
                    {currentTheme.fontFamily?.split(',')[0]?.replace(/'/g, '')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Slide Breakdown (Minimalist) */}
          {slides.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Layout Matrix</span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(slides.map((s) => s.type)))
                  .filter(Boolean)
                  .map((type) => (
                    <div
                      key={type}
                      className="text-[9px] px-2 py-1 font-bold text-muted-foreground bg-muted/30 border border-border rounded-lg uppercase tracking-tight"
                    >
                      {type}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Action */}
      <AnimatePresence>
        {streamComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 border-t border-border bg-muted/10"
          >
            <Button
              onClick={onOpenEditor}
              className="w-full font-bold rounded-2xl h-12 shadow-sm transition-all active:scale-95"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Launch Editor
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}
