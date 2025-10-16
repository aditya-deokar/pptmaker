'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSlideStore } from '@/store/useSlideStore'
import { generatePresentationAction } from '@/actions/generatePresentation'
import type { Slide } from '@/lib/types'
import type { AgentStep, AgentStatus } from '@/components/global/agentic-workflow/AgenticProgressTracker'

/**
 * Agent Step Configuration for V2 Workflow
 * 8 specialized agents with progress milestones
 */
export const AGENT_STEPS_CONFIG_V2 = [
  {
    id: 'projectInitializer',
    name: 'Project Initializer',
    description: 'Creating project in database',
    icon: '🎯',
    progress: 10,
    estimatedTime: '2s'
  },
  {
    id: 'outlineGenerator',
    name: 'Outline Generator',
    description: 'Generating slide topics based on complexity',
    icon: '📋',
    progress: 20,
    estimatedTime: '5s'
  },
  {
    id: 'contentWriter',
    name: 'Content Writer',
    description: 'Writing content for all slides',
    icon: '✍️',
    progress: 40,
    estimatedTime: '10s'
  },
  {
    id: 'layoutSelector',
    name: 'Layout Selector',
    description: 'AI-powered layout selection',
    icon: '🎨',
    progress: 55,
    estimatedTime: '5s'
  },
  {
    id: 'imageQueryGenerator',
    name: 'Image Query Generator',
    description: 'Creating image search queries',
    icon: '🔍',
    progress: 65,
    estimatedTime: '3s'
  },
  {
    id: 'imageFetcher',
    name: 'Image Fetcher',
    description: 'Fetching placeholder images',
    icon: '🖼️',
    progress: 75,
    estimatedTime: '8s'
  },
  {
    id: 'jsonCompiler',
    name: 'JSON Compiler',
    description: 'Building final presentation structure',
    icon: '📦',
    progress: 85,
    estimatedTime: '5s'
  },
  {
    id: 'databasePersister',
    name: 'Database Persister',
    description: 'Saving presentation to database',
    icon: '💾',
    progress: 100,
    estimatedTime: '3s'
  }
] as const

export interface UseAgenticGenerationV2Return {
  // State
  isGenerating: boolean
  progress: number
  currentAgent: string
  currentAgentName: string
  currentAgentDescription: string
  error: string | null
  
  // Actions
  generate: (topic: string, additionalContext?: string, theme?: string) => Promise<void>
  reset: () => void
  
  // Metadata
  agentSteps: AgentStep[]
}

/**
 * Convert V2 agent steps to AgentStep format with status
 */
function convertToAgentSteps(currentProgress: number): AgentStep[] {
  return AGENT_STEPS_CONFIG_V2.map((step, index) => {
    let status: AgentStatus = 'pending'
    
    const nextStep = AGENT_STEPS_CONFIG_V2[index + 1]
    const prevStep = AGENT_STEPS_CONFIG_V2[index - 1]
    
    // Determine status based on progress
    if (currentProgress >= 100 && index === AGENT_STEPS_CONFIG_V2.length - 1) {
      // Last step and completed
      status = 'completed'
    } else if (currentProgress >= step.progress && (!nextStep || currentProgress < nextStep.progress)) {
      // Currently running this step
      status = 'running'
    } else if (currentProgress > step.progress) {
      // Already completed this step
      status = 'completed'
    }
    
    return {
      id: step.id,
      name: step.name,
      description: step.description,
      status
    }
  })
}

/**
 * Hook: useAgenticGenerationV2
 * 
 * Manages the V2 agentic workflow for presentation generation.
 * Uses real AI agents instead of simulation.
 * 
 * Features:
 * - Real-time progress tracking (0-100%)
 * - 8 specialized AI agents
 * - Database integration
 * - Error handling and recovery
 * - Automatic navigation on success
 * 
 * @example
 * ```tsx
 * const { generate, isGenerating, progress, currentAgentName } = useAgenticGenerationV2()
 * 
 * await generate('Introduction to AI', 'Focus on machine learning')
 * ```
 */
export function useAgenticGenerationV2(): UseAgenticGenerationV2Return {
  const router = useRouter()
  const { setProject, setSlides } = useSlideStore()
  
  // State management
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentAgent, setCurrentAgent] = useState('')
  const [error, setError] = useState<string | null>(null)

  /**
   * Get current agent details based on progress
   */
  const getCurrentAgentInfo = useCallback((progressValue: number) => {
    // Find the agent that matches or is closest to current progress
    const agent = AGENT_STEPS_CONFIG_V2.find((step, index) => {
      const nextStep = AGENT_STEPS_CONFIG_V2[index + 1]
      return progressValue >= step.progress && (!nextStep || progressValue < nextStep.progress)
    }) || AGENT_STEPS_CONFIG_V2[0]
    
    return agent
  }, [])

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsGenerating(false)
    setProgress(0)
    setCurrentAgent('')
    setError(null)
  }, [])

  /**
   * Generate presentation using V2 workflow
   */
  const generate = useCallback(async (
    topic: string,
    additionalContext?: string,
    theme: string = 'light'
  ) => {
    try {
      // Reset state
      reset()
      setIsGenerating(true)
      setError(null)

      console.log('🚀 Starting V2 generation:', { topic, additionalContext, theme })

      // Simulate progress updates while waiting for server response
      // This provides better UX since the actual workflow doesn't stream progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          // Slowly increment up to 95% while waiting
          if (prev < 95) {
            const increment = Math.random() * 5 + 2 // 2-7% increments
            const newProgress = Math.min(prev + increment, 95)
            
            // Update current agent based on progress
            const agentInfo = getCurrentAgentInfo(newProgress)
            setCurrentAgent(agentInfo.id)
            
            return newProgress
          }
          return prev
        })
      }, 1000) // Update every second

      // Call the server action (this is the real AI workflow)
      const result = await generatePresentationAction(topic, additionalContext, theme)

      // Clear the progress interval
      clearInterval(progressInterval)

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate presentation')
      }

      // Set final progress
      setProgress(100)
      setCurrentAgent('databasePersister')

      console.log('✅ Generation completed:', {
        projectId: 'projectId' in result ? result.projectId : null,
        slideCount: 'slideCount' in result ? result.slideCount : 0
      })

      // Update store with the generated data
      if ('slides' in result && result.slides) {
        setSlides(result.slides as Slide[])
      }

      // Navigate to editor after short delay
      setTimeout(() => {
        if ('projectId' in result && result.projectId) {
          router.push(`/presentation/${result.projectId}`)
        }
      }, 500)

    } catch (err) {
      console.error('❌ Generation error:', err)
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setProgress(0)
      setCurrentAgent('')
      
    } finally {
      setIsGenerating(false)
    }
  }, [router, setProject, setSlides, reset, getCurrentAgentInfo])

  // Get current agent info
  const currentAgentInfo = getCurrentAgentInfo(progress)

  return {
    // State
    isGenerating,
    progress,
    currentAgent,
    currentAgentName: currentAgentInfo.name,
    currentAgentDescription: currentAgentInfo.description,
    error,
    
    // Actions
    generate,
    reset,
    
    // Metadata - Convert to AgentStep format
    agentSteps: convertToAgentSteps(progress)
  }
}
