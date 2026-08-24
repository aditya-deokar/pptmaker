// src/app/api/generation/stream/route.ts - SSE endpoint for streaming LLM responses
//
// Security: the route authenticates via the Clerk session and only streams
// runs owned by the session user. Unknown/foreign runIds receive 404 before
// any subscription is created.

import { NextRequest } from 'next/server'
import { streamingEmitter, type StreamEvent } from '@/lib/streaming/EventEmitter'
import { getAuthenticatedAppUser } from '@/actions/project-access'
import { getOwnedGenerationRun } from '@/core/generation/runs'
import { normalizeSteps } from '@/core/generation/steps'

export const dynamic = 'force-dynamic'

function formatSSEEvent(event: StreamEvent): string {
  const data = JSON.stringify(event)
  return `data: ${data}\n\n`
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const runId = searchParams.get('runId')

  if (!runId) {
    return new Response('Missing runId parameter', { status: 400 })
  }

  const auth = await getAuthenticatedAppUser()
  if (auth.status !== 200) {
    return new Response('Unauthorized', { status: 401 })
  }

  const run = await getOwnedGenerationRun(runId, auth.user.id)
  if (!run) {
    return new Response('Generation run not found', { status: 404 })
  }

  console.log(`[SSE] Client connected for runId: ${runId}`)

  // Resume support: clients reconnect with ?lastSeq=<n> (or a Last-Event-ID
  // header) to skip events they already rendered.
  const lastEventIdHeader = request.headers.get('last-event-id')
  const lastSeq = Number.parseInt(
    searchParams.get('lastSeq') ?? lastEventIdHeader ?? '0',
    10
  ) || 0

  let heartbeatInterval: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      let nextSeq = lastSeq

      const sendEvent = (event: StreamEvent) => {
        try {
          if (typeof event.seq === 'number') {
            nextSeq = Math.max(nextSeq, event.seq)
          }
          const data = formatSSEEvent(event)
          controller.enqueue(encoder.encode(data))
        } catch (err) {
          console.error('[SSE] Error sending event:', err)
        }
      }

      // Hydration snapshot built from the DB row so late joiners paint the
      // full step state instantly instead of waiting for the next transition.
      sendEvent({
        type: 'progress',
        stepId: run.currentStepId ?? undefined,
        progress: run.progress,
        steps: normalizeSteps(run.steps),
        timestamp: Date.now(),
      })

      // Replay missed events when resuming.
      const history = streamingEmitter.getHistoryAfter(runId, lastSeq)
      if (history.length > 0) {
        console.log(`[SSE] Replaying ${history.length} historical events after seq ${lastSeq}`)
        history.forEach(event => sendEvent(event))
      }

      let isConnected = true

      const unsubscribe = streamingEmitter.subscribe(runId, (event) => {
        if (!isConnected) return
        if (typeof event.seq === 'number' && event.seq <= lastSeq) return
        console.log(`[SSE] Sending event: ${event.type} for ${event.agentId || event.stepId}`)
        sendEvent(event)
      })

      console.log(`[SSE] Subscribed to events for runId: ${runId}`)

      // More frequent heartbeat to keep connection alive
      heartbeatInterval = setInterval(() => {
        if (!isConnected) {
          if (heartbeatInterval) clearInterval(heartbeatInterval)
          return
        }
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          if (heartbeatInterval) clearInterval(heartbeatInterval)
        }
      }, 5000)

      // Keep connection alive with frequent comments
      const keepAliveInterval = setInterval(() => {
        if (!isConnected) {
          clearInterval(keepAliveInterval)
          return
        }
        try {
          controller.enqueue(encoder.encode('\n'))
        } catch {
          clearInterval(keepAliveInterval)
        }
      }, 2000)

      request.signal.addEventListener('abort', () => {
        isConnected = false
        if (heartbeatInterval) clearInterval(heartbeatInterval)
        clearInterval(keepAliveInterval)
        unsubscribe()
        console.log(`[SSE] Client disconnected for runId: ${runId} at seq ${nextSeq}`)
        try {
          controller.close()
        } catch {
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Keep-Alive': 'timeout=120, max=1',
    },
  })
}
