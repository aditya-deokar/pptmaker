'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { AgentStep, AgentStatus } from './AgenticProgressTracker'
import { AgenticStreamViewer } from './AgenticStreamViewer'
import { useStreamingGeneration } from '@/hooks/useStreamingGeneration'
import type { StreamEvent } from '@/hooks/useStreamingGeneration'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Loader2, BrainCircuit } from 'lucide-react'

/** Pre-connected stream state owned by the parent hook (single SSE channel). */
export interface AgenticStreamState {
  isConnected: boolean
  isConnecting: boolean
  events: StreamEvent[]
  currentTokens: Record<string, string>
  currentAgentId: string | null
  error: string | null
}

interface AgenticWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
  topic: string
  steps?: readonly AgentStep[] | AgentStep[]
  currentProgress?: number
  currentAgentName?: string
  currentAgentDescription?: string
  runId?: string | null
  showStream?: boolean
  /** When provided, the dialog reuses this stream instead of connecting itself. */
  stream?: AgenticStreamState
}

const AgenticWorkflowDialog = ({
  open,
  onOpenChange,
  onComplete,
  topic,
  currentProgress: externalProgress,
  currentAgentName,
  runId,
  showStream = true,
  stream: externalStream
}: AgenticWorkflowDialogProps) => {
  const [progress, setProgress] = useState(externalProgress || 0)
  const [streamEnabled, setStreamEnabled] = useState(showStream)
  
  // Extra visual state for auto redirect
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [countdown, setCountdown] = useState(2)

  const internalStream = useStreamingGeneration()
  const activeStream = externalStream ?? {
    isConnected: internalStream.isConnected,
    isConnecting: internalStream.isConnecting,
    events: internalStream.events,
    currentTokens: internalStream.currentTokens,
    currentAgentId: internalStream.currentAgentId,
    error: internalStream.error,
  }
  const { connect, disconnect } = internalStream

  const {
    isConnected,
    isConnecting,
    events,
    currentTokens,
    currentAgentId,
    error: streamError,
  } = activeStream

  useEffect(() => {
    if (open && runId && streamEnabled && !externalStream) {
      connect(runId)
    }
    return () => {
      if (!open) {
        if (!externalStream) disconnect()
        setIsRedirecting(false)
        setCountdown(2)
      }
    }
  }, [open, runId, streamEnabled, connect, disconnect, externalStream])

  React.useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress)
    }
  }, [externalProgress])

  // Handle auto-redirect countdown
  useEffect(() => {
    if (progress === 100) {
      setIsRedirecting(true)
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [progress])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-background/80 backdrop-blur-md z-[100]" />
      <DialogContent className="max-w-4xl w-[90vw] p-0 overflow-hidden border border-white/10 bg-background/95 shadow-2xl z-[101] rounded-3xl">
        
        <div className="relative flex flex-col h-[70vh] md:h-[600px] overflow-hidden">
          
          {/* Decorative Glowing Orbs */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-[-20%] left-10 w-96 h-96 rounded-full bg-blue-500/20 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-10 w-96 h-96 rounded-full bg-purple-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Minimalist Header */}
          <div className="p-6 border-b border-white/5 relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {progress === 100 ? "Presentation Ready" : "Agentic Synthesis"}
                </h2>
                <p className="text-sm text-muted-foreground truncate max-w-md">
                  {topic}
                </p>
              </div>
            </div>
            
            {/* Status indicator */}
            {!isRedirecting && (
              <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-full border border-white/5">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected && progress < 100 ? "bg-emerald-400" : "bg-gray-400 hidden"}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${progress === 100 ? "bg-emerald-500" : isConnected ? "bg-emerald-500" : "bg-gray-500"}`} />
                </span>
                <span className="text-xs font-mono font-medium text-muted-foreground">
                  {isConnected ? `${Math.round(progress)}%` : "Connecting..."}
                </span>
              </div>
            )}
          </div>

          {/* Core Streaming UI */}
          <div className="flex-1 min-h-0 overflow-hidden relative z-10 p-6 bg-gradient-to-b from-transparent to-background/50">
            <AnimatePresence mode="wait">
              {isRedirecting ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="bg-emerald-500/10 p-6 rounded-full border border-emerald-500/20 shadow-[0_0_40px_-10px] shadow-emerald-500/30">
                    <Sparkles className="h-12 w-12 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">Generation Complete</h3>
                    <p className="text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                      Redirecting to editor in {countdown}s
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="streaming"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  {streamEnabled && (
                    <AgenticStreamViewer
                      events={events}
                      currentTokens={currentTokens}
                      isConnected={isConnected}
                      isConnecting={isConnecting}
                      currentAgentId={currentAgentId}
                      error={streamError}
                      onRetry={runId ? () => connect(runId) : undefined}
                      className="h-full border-0 bg-transparent shadow-none"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Clean Progress Bar at bottom */}
          {!isRedirecting && (
            <div className="h-1.5 w-full bg-muted/30 relative z-10">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 50, damping: 15 }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AgenticWorkflowDialog

export const useAgenticWorkflow = () => {
  const [open, setOpen] = useState(false)
  const [steps, setSteps] = useState<AgentStep[]>([])

  const updateStep = (stepId: string, status: AgentStatus, details?: string) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, details } : step
    ))
  }

  const resetWorkflow = () => {
    setSteps([])
  }

  return {
    open,
    setOpen,
    steps,
    updateStep,
    resetWorkflow
  }
}
