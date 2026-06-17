type GenerationTelemetryEvent =
  | 'run_created'
  | 'run_started'
  | 'run_completed'
  | 'run_failed'
  | 'timeout_returned_running'
  | 'status_read';

interface GenerationTelemetryFields {
  runId: string;
  userId?: string;
  authMethod?: string;
  status?: string;
  topic?: string;
  projectId?: string | null;
  progress?: number;
  waitTimeoutMs?: number;
  latencyMs?: number;
  error?: string | null;
}

function sanitizeTelemetryField(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.length > 240 ? `${value.slice(0, 240)}...` : value;
}

export function logGenerationTelemetry(
  event: GenerationTelemetryEvent,
  fields: GenerationTelemetryFields
): void {
  const sanitizedFields = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      key === 'topic'
        ? '[REDACTED_USER_CONTENT]'
        : sanitizeTelemetryField(value),
    ])
  );

  console.error(JSON.stringify({
    level: event === 'run_failed' ? 'error' : 'info',
    component: 'mcp',
    event: `generation_${event}`,
    timestamp: new Date().toISOString(),
    ...sanitizedFields,
  }));
}
