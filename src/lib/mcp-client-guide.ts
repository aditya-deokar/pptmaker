import {
  MCP_PROTOCOL_VERSION,
  RESOURCE_URIS,
  TOOL_NAMES,
} from '@/mcp/config/constants'

const FALLBACK_PUBLIC_APP_URL = 'https://verto.ai.aditya-deokar.me'

export const MCP_DOCS_PATH = '/docs/mcp/04-usage-guide'
export const MCP_HTTP_PATH = '/api/mcp'
export const MCP_DISCOVERY_PATH = '/.well-known/oauth-protected-resource'
export { MCP_PROTOCOL_VERSION }

export const MCP_REMOTE_TOKEN_ENV_VAR = 'VERTO_MCP_KEY'
export const MCP_STDIO_TOKEN_ENV_VAR = 'VERTO_API_KEY'
export const MCP_API_KEY_PLACEHOLDER = 'vk_live_your_api_key'

export interface McpGuideResource {
  uri: string
  description: string
}

export interface McpGuideTool {
  name: string
  description: string
}

export interface McpClientSetupExample {
  id: string
  title: string
  description: string
  type: 'code' | 'steps'
  language?: string
  code?: string
  fileHint?: string
  steps?: string[]
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getPublicAppUrl(baseUrl?: string | null): string {
  return stripTrailingSlash(
    baseUrl || process.env.NEXT_PUBLIC_APP_URL || FALLBACK_PUBLIC_APP_URL
  )
}

export function getMcpEndpointUrl(baseUrl?: string | null): string {
  return `${getPublicAppUrl(baseUrl)}${MCP_HTTP_PATH}`
}

export function getMcpGuideUrl(baseUrl?: string | null): string {
  return `${getPublicAppUrl(baseUrl)}${MCP_DOCS_PATH}`
}

export function getMcpDiscoveryUrl(baseUrl?: string | null): string {
  return `${getPublicAppUrl(baseUrl)}${MCP_DISCOVERY_PATH}`
}

export function getMcpBearerHeaderValue(
  apiKey: string = MCP_API_KEY_PLACEHOLDER
): string {
  return `Bearer ${apiKey}`
}

export function getGenericRemoteConfig(baseUrl?: string | null): string {
  const endpoint = getMcpEndpointUrl(baseUrl)

  return String.raw`{
  "mcpServers": {
    "verto-ai": {
      "type": "streamable-http",
      "url": "${endpoint}",
      "headers": {
        "Authorization": "Bearer \${${MCP_REMOTE_TOKEN_ENV_VAR}}"
      }
    }
  }
}`
}

export function getClaudeCodeCommand(baseUrl?: string | null): string {
  const endpoint = getMcpEndpointUrl(baseUrl)

  return String.raw`claude mcp add --transport http verto-ai ${endpoint} \
  --header "Authorization: Bearer \${${MCP_REMOTE_TOKEN_ENV_VAR}}"`
}

export function getCursorRemoteConfig(baseUrl?: string | null): string {
  const endpoint = getMcpEndpointUrl(baseUrl)

  return String.raw`{
  "mcpServers": {
    "verto-ai": {
      "url": "${endpoint}",
      "headers": {
        "Authorization": "Bearer \${env:${MCP_REMOTE_TOKEN_ENV_VAR}}"
      }
    }
  }
}`
}

export function getLocalStdioConfig(): string {
  return String.raw`{
  "mcpServers": {
    "verto-ai-local": {
      "command": "npx",
      "args": ["tsx", "src/mcp/transport/stdio.ts"],
      "cwd": "/path/to/pptmaker",
      "env": {
        "${MCP_STDIO_TOKEN_ENV_VAR}": "${MCP_API_KEY_PLACEHOLDER}"
      }
    }
  }
}`
}

export const MCP_GUIDE_TOOLS: McpGuideTool[] = [
  {
    name: TOOL_NAMES.PRESENTATION_LIST,
    description:
      "List the authenticated user's presentations with pagination and soft-delete filtering.",
  },
  {
    name: TOOL_NAMES.PRESENTATION_GET,
    description:
      'Read a presentation by ID, with optional slide JSON for full editing workflows.',
  },
  {
    name: TOOL_NAMES.PRESENTATION_CREATE,
    description: 'Create a new presentation from a title and outline list.',
  },
  {
    name: TOOL_NAMES.PRESENTATION_DELETE,
    description: 'Soft-delete a presentation without permanently removing it.',
  },
  {
    name: TOOL_NAMES.PRESENTATION_RECOVER,
    description: 'Recover a previously soft-deleted presentation.',
  },
  {
    name: TOOL_NAMES.PRESENTATION_DELETE_PERMANENTLY,
    description:
      'Permanently delete one or more presentations. Requires confirm: true.',
  },
  {
    name: TOOL_NAMES.PRESENTATION_UPDATE_SLIDES,
    description:
      'Replace the full slides array after reading the current presentation.',
  },
  {
    name: TOOL_NAMES.PRESENTATION_UPDATE_THEME,
    description: 'Switch the visual theme of an existing presentation.',
  },
  {
    name: TOOL_NAMES.PRESENTATION_PUBLISH,
    description: 'Generate a public share URL for a presentation.',
  },
  {
    name: TOOL_NAMES.PRESENTATION_UNPUBLISH,
    description: 'Disable public access for a previously published deck.',
  },
  {
    name: TOOL_NAMES.PRESENTATION_GENERATE,
    description:
      "Run Verto AI's long-running generation pipeline and track progress.",
  },
]

export const MCP_GUIDE_RESOURCES: McpGuideResource[] = [
  {
    uri: RESOURCE_URIS.PRESENTATIONS,
    description: 'Read-only presentation discovery context.',
  },
  {
    uri: RESOURCE_URIS.TEMPLATES,
    description: 'Published template catalog and metadata.',
  },
  {
    uri: RESOURCE_URIS.THEMES,
    description: 'Valid theme names and visual metadata.',
  },
  {
    uri: RESOURCE_URIS.GENERATION_PROGRESS,
    description: 'Progress status for a running AI generation job.',
  },
]

export function getMcpClientSetupExamples(
  baseUrl?: string | null
): McpClientSetupExample[] {
  return [
    {
      id: 'claude-code',
      title: 'Claude Code',
      description:
        'Best for local development workflows when you want a one-line remote MCP setup.',
      type: 'code',
      language: 'bash',
      code: getClaudeCodeCommand(baseUrl),
    },
    {
      id: 'cursor',
      title: 'Cursor',
      description:
        'Add a remote MCP server to `.cursor/mcp.json` or `~/.cursor/mcp.json`.',
      type: 'code',
      language: 'json',
      fileHint: '.cursor/mcp.json',
      code: getCursorRemoteConfig(baseUrl),
    },
    {
      id: 'generic-http',
      title: 'Generic Remote MCP Client',
      description:
        'Use this shape for clients that accept a remote Streamable HTTP server definition.',
      type: 'code',
      language: 'json',
      code: getGenericRemoteConfig(baseUrl),
    },
    {
      id: 'claude-connectors',
      title: 'Claude / Claude Desktop Custom Connector',
      description:
        "Use this when you want Claude to reach the hosted server through Anthropic's remote connector flow.",
      type: 'steps',
      steps: [
        'Open Claude, then go to Customize > Connectors.',
        'Choose Add custom connector and paste the hosted MCP URL.',
        'Use the Verto AI MCP URL shown on this page.',
        'If prompted for advanced auth settings, keep the default flow unless you later add OAuth to this server.',
        'Connect and authorize the tool, then enable it per conversation.',
      ],
    },
    {
      id: 'local-stdio',
      title: 'Local stdio Fallback',
      description:
        'Only use this if you are running the Verto AI repo locally and want the client to spawn the server process itself.',
      type: 'code',
      language: 'json',
      code: getLocalStdioConfig(),
    },
  ]
}

export const MCP_STREAMABLE_HTTP_NOTES = [
  `This deployment currently advertises MCP protocol version ${MCP_PROTOCOL_VERSION}.`,
  'The hosted HTTP endpoint is session-based, so a client must initialize before sending tool calls.',
  'A direct tools/list POST without the MCP initialize handshake will be rejected by this server.',
  'Use a real MCP client or MCP Inspector for validation instead of treating the endpoint like a REST API.',
]
