// src/lib/streaming/EventEmitter.ts - Event emitter for SSE streaming

export interface StreamEvent {
  type: 'progress' | 'token' | 'agent_start' | 'agent_complete' | 'error' | 'complete'
  agentId?: string
  agentName?: string
  content?: string
  stepId?: string
  progress?: number
  output?: unknown
  message?: string
  projectId?: string
  /** Full normalized step snapshots (snapshot/hydrate events only). */
  steps?: unknown[]
  /** Monotonic per-run sequence number stamped by emit(). */
  seq?: number
  timestamp: number
}

type EventCallback = (event: StreamEvent) => void

/** History entries older than this are swept even if never cleared. */
const HISTORY_TTL_MS = 30 * 60 * 1000

class StreamingEventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private eventHistory: Map<string, StreamEvent[]> = new Map()
  private seqCounters: Map<string, number> = new Map()
  private lastActivityAt: Map<string, number> = new Map()
  private maxHistorySize = 1000

  subscribe(runId: string, callback: EventCallback): () => void {
    if (!this.listeners.has(runId)) {
      this.listeners.set(runId, new Set())
    }

    this.listeners.get(runId)!.add(callback)

    const existingEvents = this.eventHistory.get(runId) || []
    existingEvents.forEach(event => callback(event))

    return () => {
      const runListeners = this.listeners.get(runId)
      if (runListeners) {
        runListeners.delete(callback)
        if (runListeners.size === 0) {
          // Keep history so a late reconnect can still replay the run;
          // it is removed by clearHistory() on completion/failure or by
          // the TTL sweep below.
          this.listeners.delete(runId)
        }
      }
    }
  }

  emit(runId: string, event: StreamEvent): void {
    const listeners = this.listeners.get(runId)
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    }

    if (!this.eventHistory.has(runId)) {
      this.eventHistory.set(runId, [])
    }

    const history = this.eventHistory.get(runId)!
    const nextSeq = (this.seqCounters.get(runId) ?? 0) + 1
    this.seqCounters.set(runId, nextSeq)
    const stamped: StreamEvent = { ...eventWithTimestamp, seq: nextSeq }

    history.push(stamped)

    if (history.length > this.maxHistorySize) {
      history.shift()
    }
    this.lastActivityAt.set(runId, Date.now())
    this.sweepStaleRuns()

    if (!listeners) {
      console.log(`[EventEmitter] No listeners for runId: ${runId}, event type: ${stamped.type}`)
      return
    }

    console.log(`[EventEmitter] Emitting to ${listeners.size} listeners: ${stamped.type} for ${stamped.agentId || stamped.stepId}`)
    listeners.forEach(callback => callback(stamped))
  }

  /** Latest sequence number issued for a run (0 when unknown). */
  getLatestSeq(runId: string): number {
    return this.seqCounters.get(runId) ?? 0
  }

  /**
   * Replay history for a run after a given sequence number.
   * Pass 0 to replay everything.
   */
  getHistoryAfter(runId: string, afterSeq: number): StreamEvent[] {
    const history = this.eventHistory.get(runId) || []
    return history.filter(event => (event.seq ?? 0) > afterSeq)
  }

  emitAgentStart(runId: string, agentId: string, agentName: string): void {
    this.emit(runId, {
      type: 'agent_start',
      agentId,
      agentName,
      timestamp: Date.now(),
    })
  }

  emitToken(runId: string, agentId: string, content: string): void {
    this.emit(runId, {
      type: 'token',
      agentId,
      content,
      timestamp: Date.now(),
    })
  }

  emitProgress(
    runId: string,
    stepId: string,
    progress: number,
    steps?: unknown[]
  ): void {
    this.emit(runId, {
      type: 'progress',
      stepId,
      progress,
      ...(steps ? { steps } : {}),
      timestamp: Date.now(),
    })
  }

  emitAgentComplete(runId: string, agentId: string, output: unknown): void {
    this.emit(runId, {
      type: 'agent_complete',
      agentId,
      output,
      timestamp: Date.now(),
    })
  }

  emitError(runId: string, message: string): void {
    this.emit(runId, {
      type: 'error',
      message,
      timestamp: Date.now(),
    })
  }

  emitComplete(runId: string, projectId: string): void {
    this.emit(runId, {
      type: 'complete',
      projectId,
      timestamp: Date.now(),
    })
  }

  getHistory(runId: string): StreamEvent[] {
    return this.eventHistory.get(runId) || []
  }

  clearHistory(runId: string): void {
    this.eventHistory.delete(runId)
    this.seqCounters.delete(runId)
    this.lastActivityAt.delete(runId)
    this.listeners.delete(runId)
  }

  /** Drop finished/idle runs whose buffers outlived the TTL window. */
  private sweepStaleRuns(): void {
    const now = Date.now()
    for (const runId of Array.from(this.lastActivityAt.keys())) {
      if (this.listeners.has(runId)) continue
      const lastAt = this.lastActivityAt.get(runId) ?? 0
      if (now - lastAt > HISTORY_TTL_MS) {
        this.clearHistory(runId)
      }
    }
  }
}

const g = global as any
if (!g._streamingEmitter) {
  g._streamingEmitter = new StreamingEventEmitter()
}
export const streamingEmitter: StreamingEventEmitter = g._streamingEmitter
