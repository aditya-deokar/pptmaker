'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type StreamEventType = 
  | 'progress' 
  | 'token' 
  | 'agent_start' 
  | 'agent_complete' 
  | 'error' 
  | 'complete'

export interface StreamEvent {
  type: StreamEventType
  agentId?: string
  agentName?: string
  content?: string
  stepId?: string
  progress?: number
  output?: unknown
  message?: string
  projectId?: string
  /** Full normalized step snapshots (hydration events). */
  steps?: unknown[]
  /** Monotonic per-run sequence stamped by the server emitter. */
  seq?: number
  timestamp: number
}

interface UseStreamingGenerationReturn {
  isConnected: boolean
  isConnecting: boolean
  events: StreamEvent[]
  currentTokens: Record<string, string>
  currentAgentId: string | null
  error: string | null
  connect: (runId: string) => void
  disconnect: () => void
  clear: () => void
}

/** Reconnect policy: exponential backoff with jitter, capped attempts. */
const MAX_RECONNECT_ATTEMPTS = 8
const BASE_RETRY_DELAY_MS = 500
const MAX_RETRY_DELAY_MS = 30_000

function retryDelay(attempt: number): number {
  const exponential = Math.min(
    MAX_RETRY_DELAY_MS,
    BASE_RETRY_DELAY_MS * Math.pow(2, attempt)
  )
  return exponential / 2 + Math.random() * (exponential / 2)
}

/**
 * SSE consumer for generation progress/token streams.
 *
 * Uses a fetch-based reader instead of EventSource so non-200 responses are
 * observable: 401/404 stop reconnection immediately; transient failures
 * reconnect with capped exponential backoff and a ?lastSeq= resume cursor.
 */
export function useStreamingGeneration(): UseStreamingGenerationReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [events, setEvents] = useState<StreamEvent[]>([])
  const [currentTokens, setCurrentTokens] = useState<Record<string, string>>({})
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const runIdRef = useRef<string | null>(null)
  const lastSeqRef = useRef(0)
  const attemptRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const teardownConnection = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const disconnect = useCallback(() => {
    teardownConnection()
    runIdRef.current = null
    setIsConnected(false)
    setIsConnecting(false)
  }, [teardownConnection])

  const clear = useCallback(() => {
    setEvents([])
    setCurrentTokens({})
    setCurrentAgentId(null)
    setError(null)
  }, [])

  const handleEvent = useCallback((data: StreamEvent) => {
    if (typeof data.seq === 'number') {
      lastSeqRef.current = Math.max(lastSeqRef.current, data.seq)
    }

    setEvents(prev => [...prev.slice(-499), data])

    if (data.type === 'agent_start' && data.agentId) {
      setCurrentAgentId(data.agentId)
    }

    if (data.type === 'agent_complete' && data.agentId) {
      setCurrentAgentId(null)
    }

    if (data.type === 'token' && data.agentId && data.content) {
      setCurrentTokens(prev => ({
        ...prev,
        [data.agentId!]: (prev[data.agentId!] || '') + data.content,
      }))
    }

    if (data.type === 'error') {
      setError(data.message || 'Streaming error')
    }
  }, [])

  const connect = useCallback((runId: string) => {
    if (runIdRef.current === runId && (abortRef.current || isConnecting)) {
      return
    }

    teardownConnection()
    clear()
    setError(null)
    setIsConnecting(true)
    runIdRef.current = runId
    lastSeqRef.current = 0
    attemptRef.current = 0

    const openStream = async (): Promise<void> => {
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const url =
          `/api/generation/stream?runId=${encodeURIComponent(runId)}` +
          (lastSeqRef.current > 0 ? `&lastSeq=${lastSeqRef.current}` : '')

        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'text/event-stream' },
        })

        // Terminal statuses: never retry.
        if (response.status === 401 || response.status === 404) {
          setError(
            response.status === 401
              ? 'Not authorized to view this generation.'
              : 'Generation run not found.'
          )
          setIsConnecting(false)
          setIsConnected(false)
          return
        }

        if (!response.ok || !response.body) {
          throw new Error(`Stream request failed with ${response.status}`)
        }

        attemptRef.current = 0
        setIsConnected(true)
        setIsConnecting(false)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // SSE frames are separated by a blank line.
          let separatorIndex: number
          while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, separatorIndex)
            buffer = buffer.slice(separatorIndex + 2)

            for (const line of frame.split('\n')) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data:')) continue
              try {
                handleEvent(JSON.parse(trimmed.slice(5).trim()) as StreamEvent)
              } catch (err) {
                console.error('[useStreaming] Failed to parse event:', err)
              }
            }
          }
        }

        // Server closed the stream normally (e.g. page navigated away).
        setIsConnected(false)
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
        console.error('[useStreaming] Stream error:', err)
        setIsConnected(false)
      }

      // Transient failure or server close: reconnect with backoff.
      if (
        runIdRef.current === runId &&
        attemptRef.current < MAX_RECONNECT_ATTEMPTS
      ) {
        attemptRef.current += 1
        const delay = retryDelay(attemptRef.current)
        console.log(`[useStreaming] Reconnecting in ${Math.round(delay)}ms (attempt ${attemptRef.current})`)
        setIsConnecting(true)
        retryTimerRef.current = setTimeout(() => {
          void openStream()
        }, delay)
      } else {
        setIsConnecting(false)
      }
    }

    void openStream()
  }, [clear, handleEvent, isConnecting, teardownConnection])

  useEffect(() => {
    return () => {
      teardownConnection()
    }
  }, [teardownConnection])

  return {
    isConnected,
    isConnecting,
    events,
    currentTokens,
    currentAgentId,
    error,
    connect,
    disconnect,
    clear,
  }
}
