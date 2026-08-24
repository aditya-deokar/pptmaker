'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSlideStore } from '@/store/useSlideStore'
import { generatePresentationAction } from '@/actions/generatePresentation'
import {
  createPresentationGenerationRun,
  getPresentationGenerationRun,
} from '@/actions/presentation-generation'
import {
  GENERATION_STEP_DEFINITIONS,
  buildGenerationStepSnapshots,
} from '@/agentic-workflow-v2/lib/progress'
import type { GenerationStepSnapshot } from '@/agentic-workflow-v2/lib/progress'
import type { Slide } from '@/lib/types'
import type {
  AgentStep,
} from '@/components/global/agentic-workflow/AgenticProgressTracker'
import {
  useStreamingGeneration,
  type StreamEvent,
} from '@/hooks/useStreamingGeneration'

export interface UseAgenticGenerationV2Return {
  isGenerating: boolean
  progress: number
  currentAgent: string
  currentAgentName: string
  currentAgentDescription: string
  error: string | null
  runId: string | null
  generate: (
    topic: string,
    additionalContext?: string,
    theme?: string,
    providedOutlines?: string[],
    projectId?: string
  ) => Promise<void>
  reset: () => void
  agentSteps: AgentStep[]
  /** Live SSE channel state; pass down to AgenticWorkflowDialog. */
  stream: {
    isConnected: boolean
    isConnecting: boolean
    events: StreamEvent[]
    currentTokens: Record<string, string>
    currentAgentId: string | null
    error: string | null
  }
}

/** Poll interval used only while the SSE channel is unavailable. */
const FALLBACK_POLL_INTERVAL_MS = 5000

function mapStepsToAgentSteps(
  steps: ReturnType<typeof buildGenerationStepSnapshots>
): AgentStep[] {
  return steps.map((step) => ({
    id: step.id,
    name: step.name,
    description: step.description,
    status: step.status,
    details: step.details,
  }))
}

function getCurrentAgentInfo(agentId: string) {
  return (
    GENERATION_STEP_DEFINITIONS.find((step) => step.id === agentId) ??
    GENERATION_STEP_DEFINITIONS[0]
  )
}

function withStepStatus(
  steps: AgentStep[],
  stepId: string,
  status: AgentStep['status'],
  details?: string
): AgentStep[] {
  return steps.map((step) =>
    step.id === stepId ? { ...step, status, details: details ?? step.details } : step
  )
}

export function useAgenticGenerationV2(): UseAgenticGenerationV2Return {
  const router = useRouter()
  const { setSlides } = useSlideStore()

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentAgent, setCurrentAgent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>(
    mapStepsToAgentSteps(buildGenerationStepSnapshots())
  )

  const stream = useStreamingGeneration()

  const activeRunRef = useRef<string | null>(null)

  const reset = useCallback(() => {
    setIsGenerating(false)
    setProgress(0)
    setCurrentAgent('')
    setError(null)
    setRunId(null)
    setAgentSteps(mapStepsToAgentSteps(buildGenerationStepSnapshots()))
  }, [])

  const hydrateStepsFromSnapshots = useCallback((snapshots: unknown[]) => {
    const byId = new Map<string, GenerationStepSnapshot>()
    for (const item of snapshots) {
      if (item && typeof item === 'object' && 'id' in (item as Record<string, unknown>)) {
        const record = item as GenerationStepSnapshot
        if (typeof record.id === 'string') byId.set(record.id, record)
      }
    }
    setAgentSteps((prev) =>
      prev.map((step) => {
        const snapshot = byId.get(step.id)
        return snapshot
          ? { ...step, status: snapshot.status, details: snapshot.details }
          : step
      })
    )
  }, [])

  const pollProgress = useCallback(async (targetRunId: string) => {
    const response = await getPresentationGenerationRun(targetRunId)
    if (response.status !== 200 || !response.data) {
      return
    }

    const data = response.data
    setProgress(data.progress)
    setCurrentAgent(data.currentStepId || '')
    hydrateStepsFromSnapshots(data.steps as unknown[])

    if (data.status === 'FAILED' && data.error) {
      setError(data.error)
    }
  }, [hydrateStepsFromSnapshots])

  // Primary channel: map live SSE events onto UI state.
  useEffect(() => {
    if (!runId) return

    for (const event of stream.events.slice(-8)) {
      switch (event.type) {
        case 'agent_start':
          if (event.agentId) {
            setCurrentAgent(event.agentId)
            setAgentSteps((prev) => withStepStatus(prev, event.agentId!, 'running'))
          }
          break
        case 'agent_complete':
          if (event.agentId) {
            setAgentSteps((prev) => withStepStatus(prev, event.agentId!, 'completed'))
          }
          break
        case 'progress':
          if (typeof event.progress === 'number') setProgress(event.progress)
          if (event.stepId) setCurrentAgent(event.stepId)
          if (Array.isArray(event.steps)) hydrateStepsFromSnapshots(event.steps)
          break
        case 'complete':
          setProgress(100)
          break
        case 'error':
          if (!error && event.message) setError(event.message)
          break
        default:
          break
      }
    }
    // Intentionally keyed on the raw array identity; slice keeps work small.
  }, [stream.events, runId, hydrateStepsFromSnapshots, error])

  // Fallback channel: poll only while the stream is unavailable.
  useEffect(() => {
    if (!isGenerating || !runId) return
    if (stream.isConnected || stream.isConnecting) return

    const interval = setInterval(() => {
      void pollProgress(runId)
    }, FALLBACK_POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isGenerating, runId, stream.isConnected, stream.isConnecting, pollProgress])

  useEffect(() => {
    return () => {
      stream.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generate = useCallback(async (
    topic: string,
    additionalContext?: string,
    theme: string = 'Default',
    providedOutlines?: string[],
    projectId?: string
  ) => {
    try {
      reset()
      setIsGenerating(true)
      setError(null)

      const runResponse = await createPresentationGenerationRun(topic)
      if (runResponse.status !== 200 || !runResponse.data) {
        throw new Error(runResponse.error || 'Failed to create generation run')
      }

      const newRunId = runResponse.data.id
      setRunId(newRunId)
      activeRunRef.current = newRunId
      setAgentSteps(mapStepsToAgentSteps(buildGenerationStepSnapshots()))

      // Snapshot of record before streaming starts.
      await pollProgress(newRunId)

      // Open the primary SSE channel.
      stream.connect(newRunId)

      const result = await generatePresentationAction(
        topic,
        additionalContext,
        theme,
        providedOutlines,
        newRunId,
        projectId
      )

      await pollProgress(newRunId)

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate presentation')
      }

      setProgress(100)
      setCurrentAgent('databasePersister')

      if ('slides' in result && result.slides) {
        setSlides(result.slides as Slide[])
      }

      setTimeout(() => {
        if ('projectId' in result && result.projectId) {
          router.push(`/presentation/${result.projectId}`)
        }
      }, 2000)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setCurrentAgent('')
      setIsGenerating(false)
      throw new Error(errorMessage)
    } finally {
      activeRunRef.current = null
    }
  }, [router, setSlides, reset, pollProgress, stream])

  const currentAgentInfo = getCurrentAgentInfo(currentAgent)

  return {
    isGenerating,
    progress,
    currentAgent,
    currentAgentName: currentAgentInfo.name,
    currentAgentDescription: currentAgentInfo.description,
    error,
    runId,
    generate,
    reset,
    agentSteps,
    stream: {
      isConnected: stream.isConnected,
      isConnecting: stream.isConnecting,
      events: stream.events,
      currentTokens: stream.currentTokens,
      currentAgentId: stream.currentAgentId,
      error: stream.error,
    },
  }
}
