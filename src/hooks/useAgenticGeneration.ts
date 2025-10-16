'use client'

import { useState, useCallback } from 'react'
import { AgentStatus, AgentStep } from '@/components/global/agentic-workflow'
import { generatePresentationGraph } from '@/agentic-workflow/actions/genai-graph'

const AGENT_STEPS_CONFIG: Omit<AgentStep, 'status' | 'details'>[] = [
  {
    id: 'outline',
    name: 'Outline Generator',
    description: 'Creating presentation structure and key topics'
  },
  {
    id: 'content',
    name: 'Content Writer',
    description: 'Writing engaging content for each slide'
  },
  {
    id: 'layout',
    name: 'Layout Designer',
    description: 'Selecting optimal layouts and visual structure'
  },
  {
    id: 'image',
    name: 'Image Query Generator',
    description: 'Analyzing slides and generating image search queries'
  },
  {
    id: 'compiler',
    name: 'JSON Compiler',
    description: 'Compiling final presentation structure'
  }
]

interface UseAgenticGenerationOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  onStepUpdate?: (stepId: string, status: AgentStatus, details?: string) => void
}

/**
 * Custom hook for managing agentic workflow generation with progress tracking
 * 
 * @example
 * ```tsx
 * const { generate, steps, isGenerating, progress, error } = useAgenticGeneration({
 *   onSuccess: (data) => setSlides(data),
 *   onError: (err) => toast.error(err.message)
 * })
 * 
 * <Button onClick={() => generate('Introduction to AI')}>
 *   Generate
 * </Button>
 * ```
 */
export function useAgenticGeneration(options: UseAgenticGenerationOptions = {}) {
  const [steps, setSteps] = useState<AgentStep[]>(
    AGENT_STEPS_CONFIG.map(step => ({ ...step, status: 'pending' as AgentStatus }))
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<any>(null)

  // Calculate progress percentage
  const completedSteps = steps.filter(s => s.status === 'completed').length
  const progress = (completedSteps / steps.length) * 100

  /**
   * Update a specific step's status
   */
  const updateStep = useCallback((
    stepId: string, 
    status: AgentStatus, 
    details?: string
  ) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, details } : step
    ))
    options.onStepUpdate?.(stepId, status, details)
  }, [options])

  /**
   * Reset all steps to pending state
   */
  const reset = useCallback(() => {
    setSteps(AGENT_STEPS_CONFIG.map(step => ({ 
      ...step, 
      status: 'pending' as AgentStatus 
    })))
    setIsGenerating(false)
    setError(null)
    setResult(null)
  }, [])

  /**
   * Simulate progress for demo/testing purposes
   * Remove this in production and use real agent updates
   */
  const simulateProgress = useCallback(() => {
    const stepIds = steps.map(s => s.id)
    let currentIndex = 0

    const interval = setInterval(() => {
      if (currentIndex < stepIds.length) {
        updateStep(stepIds[currentIndex], 'running', `Processing ${stepIds[currentIndex]}...`)
        
        setTimeout(() => {
          updateStep(stepIds[currentIndex], 'completed')
          currentIndex++
          
          if (currentIndex >= stepIds.length) {
            clearInterval(interval)
          }
        }, 1500)
      }
    }, 2000)

    return interval
  }, [steps, updateStep])

  /**
   * Main generation function
   * Call this to start the agentic workflow
   */
  const generate = useCallback(async (topic: string) => {
    setIsGenerating(true)
    setError(null)
    reset()

    try {
      // Start progress simulation (remove in production)
      const progressInterval = simulateProgress()

      // Call the actual generation function
      const response = await generatePresentationGraph(topic)

      // Clear simulation
      clearInterval(progressInterval)

      // Mark all as completed
      steps.forEach(step => {
        updateStep(step.id, 'completed')
      })

      // Validate response
      if (!response || response.status !== 200 || !response.data) {
        throw new Error(response.error || 'Failed to generate presentation')
      }

      setResult(response.data)
      options.onSuccess?.(response.data)

      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      
      // Mark current running step as error
      const runningStep = steps.find(s => s.status === 'running')
      if (runningStep) {
        updateStep(runningStep.id, 'error', error.message)
      }

      setError(error)
      options.onError?.(error)
      
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [steps, reset, simulateProgress, updateStep, options])

  /**
   * Generate with custom step tracking
   * Use this for more control over progress updates
   */
  const generateWithTracking = useCallback(async (
    topic: string,
    trackingCallback: (stepId: string, status: AgentStatus, details?: string) => Promise<void>
  ) => {
    setIsGenerating(true)
    setError(null)
    reset()

    try {
      // Process each step with custom tracking
      for (const step of AGENT_STEPS_CONFIG) {
        updateStep(step.id, 'running')
        await trackingCallback(step.id, 'running')
        
        // Here you would call the actual agent
        // For now, simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        updateStep(step.id, 'completed')
        await trackingCallback(step.id, 'completed')
      }

      // Final compilation
      const response = await generatePresentationGraph(topic)
      
      if (!response || response.status !== 200 || !response.data) {
        throw new Error(response.error || 'Failed to generate presentation')
      }

      setResult(response.data)
      options.onSuccess?.(response.data)

      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [reset, updateStep, options])

  return {
    // State
    steps,
    isGenerating,
    progress,
    error,
    result,
    
    // Actions
    generate,
    generateWithTracking,
    updateStep,
    reset,
    
    // Computed
    isComplete: progress === 100,
    hasError: error !== null,
  }
}

/**
 * Example usage in a component:
 * 
 * ```tsx
 * function MyComponent() {
 *   const { 
 *     generate, 
 *     steps, 
 *     isGenerating, 
 *     progress,
 *     error 
 *   } = useAgenticGeneration({
 *     onSuccess: (data) => {
 *       setSlides(data)
 *       router.push('/presentation/123')
 *     },
 *     onError: (err) => {
 *       toast.error(err.message)
 *     }
 *   })
 * 
 *   return (
 *     <>
 *       <Button 
 *         onClick={() => generate('My Topic')}
 *         disabled={isGenerating}
 *       >
 *         {isGenerating ? `Generating... ${progress}%` : 'Generate'}
 *       </Button>
 * 
 *       <AgenticWorkflowDialog
 *         open={isGenerating}
 *         onOpenChange={() => {}}
 *         topic="My Topic"
 *         steps={steps}
 *       />
 *     </>
 *   )
 * }
 * ```
 */
