'use client'

import { AgentStatus } from '@/components/global/agentic-workflow'
import { create } from 'zustand'

interface AgentProgress {
  stepId: string
  status: AgentStatus
  details?: string
}

interface AgenticWorkflowState {
  isRunning: boolean
  currentTopic: string
  progress: AgentProgress[]
  error: string | null
  
  // Actions
  startWorkflow: (topic: string) => void
  updateProgress: (stepId: string, status: AgentStatus, details?: string) => void
  completeWorkflow: () => void
  resetWorkflow: () => void
  setError: (error: string) => void
}

export const useAgenticWorkflowStore = create<AgenticWorkflowState>((set) => ({
  isRunning: false,
  currentTopic: '',
  progress: [],
  error: null,

  startWorkflow: (topic: string) => {
    set({
      isRunning: true,
      currentTopic: topic,
      progress: [],
      error: null,
    })
  },

  updateProgress: (stepId: string, status: AgentStatus, details?: string) => {
    set((state) => ({
      progress: [
        ...state.progress.filter(p => p.stepId !== stepId),
        { stepId, status, details }
      ]
    }))
  },

  completeWorkflow: () => {
    set({
      isRunning: false,
    })
  },

  resetWorkflow: () => {
    set({
      isRunning: false,
      currentTopic: '',
      progress: [],
      error: null,
    })
  },

  setError: (error: string) => {
    set({
      error,
      isRunning: false,
    })
  },
}))
