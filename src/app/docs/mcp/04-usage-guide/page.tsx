import Link from 'next/link'
import {
  ArrowUpRight,
  BookOpen,
  Globe,
  KeyRound,
  Laptop,
  Network,
  PlugZap,
  Server,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  getMcpBearerHeaderValue,
  getMcpClientSetupExamples,
  getMcpDiscoveryUrl,
  getMcpEndpointUrl,
  getMcpGuideUrl,
  getPublicAppUrl,
  MCP_GUIDE_RESOURCES,
  MCP_GUIDE_TOOLS,
  MCP_PROTOCOL_VERSION,
  MCP_REMOTE_TOKEN_ENV_VAR,
  MCP_STDIO_TOKEN_ENV_VAR,
  MCP_STREAMABLE_HTTP_NOTES,
} from '@/lib/mcp-client-guide'

export const metadata = {
  title: 'Verto AI MCP Client Setup Guide',
  description:
    'Connect Claude, Cursor, and other MCP clients to the hosted Verto AI MCP server.',
}

function CodeBlock({ code, language = 'text' }: { code: string; language?: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-border/70 bg-zinc-950 p-4 text-sm text-zinc-100 shadow-inner">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-3">
      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em]">
        {eyebrow}
      </Badge>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function McpUsageGuidePage() {
  const appUrl = getPublicAppUrl()
  const endpointUrl = getMcpEndpointUrl(appUrl)
  const guideUrl = getMcpGuideUrl(appUrl)
  const discoveryUrl = getMcpDiscoveryUrl(appUrl)
  const clientExamples = getMcpClientSetupExamples(appUrl)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,250,250,1))] text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-border/60 bg-background/90 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] lg:p-10">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-700 hover:bg-emerald-500/15">
                  Hosted MCP Guide
                </Badge>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                    Connect Verto AI to Claude, Cursor, and other MCP clients
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    This app exposes a hosted MCP server for presentation workflows at{' '}
                    <span className="font-medium text-foreground">{endpointUrl}</span>. Use
                    Streamable HTTP for remote clients and keep stdio only for local developer
                    setups that run the repo directly.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={endpointUrl} target="_blank" rel="noreferrer">
                    Open MCP Endpoint
                    <ArrowUpRight />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/settings">
                    Open Settings
                    <KeyRound />
                  </Link>
                </Button>
              </div>

              <Alert className="border-emerald-500/20 bg-emerald-500/5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Recommended production path</AlertTitle>
                <AlertDescription>
                  Use the hosted Streamable HTTP endpoint with a Verto AI MCP key in the{' '}
                  <code className="rounded bg-background px-1.5 py-0.5 text-xs">
                    Authorization: {getMcpBearerHeaderValue()}
                  </code>{' '}
                  header. This avoids requiring users to clone the repo or spawn local processes.
                </AlertDescription>
              </Alert>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {[
                {
                  icon: Globe,
                  label: 'Hosted endpoint',
                  value: endpointUrl,
                },
                {
                  icon: BookOpen,
                  label: 'Discovery URL',
                  value: discoveryUrl,
                },
                {
                  icon: Workflow,
                  label: 'Protocol',
                  value: `Streamable HTTP (${MCP_PROTOCOL_VERSION})`,
                },
                {
                  icon: KeyRound,
                  label: 'Auth',
                  value: 'Bearer token or same-browser Clerk session',
                },
              ].map((item) => (
                <Card key={item.label} className="rounded-3xl border-border/70 bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="break-all text-sm font-medium leading-6 text-foreground">
                      {item.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[28px] border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Network className="h-5 w-5 text-emerald-600" />
                When To Use Streamable HTTP
              </CardTitle>
              <CardDescription>
                This is the right choice for the hosted Verto AI deployment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Use it when the MCP server lives on your public domain and multiple users or AI clients need shared access.</p>
              <p>It works well for Claude Code, Cursor, hosted agents, cloud connectors, and browser-based workflows.</p>
              <p>Users only need a URL plus a Verto AI MCP key. They do not need this repository checked out locally.</p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Laptop className="h-5 w-5 text-sky-600" />
                When To Use stdio
              </CardTitle>
              <CardDescription>
                Keep this as a fallback for local development and self-hosting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Use stdio only when the client can launch a local command like <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npx tsx src/mcp/transport/stdio.ts</code>.</p>
              <p>This is mainly for developers working inside the repo, or for clients that cannot add remote headers cleanly.</p>
              <p>For end users of the hosted app, stdio adds avoidable setup friction and should not be the default recommendation.</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="Server Analysis"
            title="How the hosted Verto AI MCP server behaves"
            description="This guide is based on the current application code. The server is mounted at `/mcp` with `/api/mcp` kept as a legacy endpoint, uses Streamable HTTP over JSON-RPC, supports Bearer-token auth, and exposes presentation tools plus read-only resources."
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <Card className="rounded-[28px] border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Server className="h-5 w-5 text-emerald-600" />
                  Request Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="font-medium text-foreground">1. Health and discovery</p>
                  <p><code className="rounded bg-background px-1.5 py-0.5 text-xs">GET /mcp</code> returns server metadata and transport details.</p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="font-medium text-foreground">2. Initialize first</p>
                  <p>The first MCP POST must be an initialize request. This server creates an MCP session and returns an <code className="rounded bg-background px-1.5 py-0.5 text-xs">MCP-Session-Id</code>.</p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="font-medium text-foreground">3. Send tool and resource requests on that session</p>
                  <p>Subsequent MCP requests reuse the session ID, and the server can respond with JSON or event streams for long-running work.</p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="font-medium text-foreground">4. Close when finished</p>
                  <p><code className="rounded bg-background px-1.5 py-0.5 text-xs">DELETE /mcp</code> closes the MCP session cleanly.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <PlugZap className="h-5 w-5 text-amber-600" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                {MCP_STREAMABLE_HTTP_NOTES.map((note) => (
                  <div key={note} className="rounded-2xl border bg-muted/30 p-4">
                    {note}
                  </div>
                ))}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-700">
                  Claude remote custom connectors reach your MCP server from Anthropic&apos;s cloud infrastructure, so this endpoint must stay publicly reachable.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="Capabilities"
            title="What clients can do after connecting"
            description="The current MCP surface is focused on end-to-end presentation management. Tools are authenticated per user, so every client only sees that user's own Verto AI data."
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[28px] border-border/70">
              <CardHeader>
                <CardTitle>Available Tools</CardTitle>
                <CardDescription>{MCP_GUIDE_TOOLS.length} tools currently registered</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {MCP_GUIDE_TOOLS.map((tool) => (
                  <div key={tool.name} className="rounded-2xl border bg-muted/20 p-4">
                    <p className="font-mono text-sm font-medium text-foreground">{tool.name}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{tool.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-border/70">
              <CardHeader>
                <CardTitle>Available Resources</CardTitle>
                <CardDescription>{MCP_GUIDE_RESOURCES.length} read-only resources currently registered</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {MCP_GUIDE_RESOURCES.map((resource) => (
                  <div key={resource.uri} className="rounded-2xl border bg-muted/20 p-4">
                    <p className="font-mono text-sm font-medium text-foreground">{resource.uri}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{resource.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="Client Setup"
            title="Ready-to-use client setup examples"
            description="These examples are aligned with the hosted Verto AI domain. Use a fresh MCP key from Settings, then drop it into the client flow that matches your environment."
          />

          <div className="grid gap-6">
            {clientExamples.map((example) => (
              <Card key={example.id} className="rounded-[28px] border-border/70">
                <CardHeader>
                  <CardTitle className="text-xl">{example.title}</CardTitle>
                  <CardDescription>{example.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {example.fileHint ? (
                    <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                      Suggested file: <code className="rounded bg-background px-1.5 py-0.5 text-xs">{example.fileHint}</code>
                    </div>
                  ) : null}

                  {example.type === 'code' && example.code ? (
                    <CodeBlock code={example.code} language={example.language} />
                  ) : null}

                  {example.type === 'steps' && example.steps ? (
                    <div className="space-y-3">
                      {example.steps.map((step, index) => (
                        <div key={step} className="flex gap-3 rounded-2xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                            {index + 1}
                          </div>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[28px] border-border/70">
            <CardHeader>
              <CardTitle>Quick Reference</CardTitle>
              <CardDescription>Use these values when a client asks for the basics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Endpoint</p>
                <p className="mt-2 break-all font-mono text-foreground">{endpointUrl}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Bearer Header</p>
                <p className="mt-2 break-all font-mono text-foreground">
                  Authorization: {getMcpBearerHeaderValue()}
                </p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Remote token env var</p>
                <p className="mt-2 font-mono text-foreground">{MCP_REMOTE_TOKEN_ENV_VAR}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Local stdio env var</p>
                <p className="mt-2 font-mono text-foreground">{MCP_STDIO_TOKEN_ENV_VAR}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border/70">
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
              <CardDescription>Most setup failures fall into one of these buckets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="font-medium text-foreground">`401` or tool auth failures</p>
                <p>Make sure the key starts with <code className="rounded bg-background px-1.5 py-0.5 text-xs">vk_live_</code> and is sent as a Bearer token for remote HTTP.</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="font-medium text-foreground">Direct curl POST fails</p>
                <p>This server expects MCP initialize and session handling. Use a real MCP client or MCP Inspector instead of calling tool methods as plain REST.</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="font-medium text-foreground">Claude connector cannot reach the server</p>
                <p>Remote Claude connectors connect from Anthropic&apos;s cloud, not your laptop. The hosted endpoint must be public and firewall-accessible.</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="font-medium text-foreground">Client does not support remote headers well</p>
                <p>Use the local stdio transport instead, or move to a client with native remote MCP header support.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="space-y-4 pb-8">
          <SectionHeading
            eyebrow="Verified References"
            title="Official client and protocol docs"
            description="These were used to cross-check current remote MCP setup patterns before writing this guide."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                label: 'Claude Code MCP docs',
                href: 'https://docs.anthropic.com/en/docs/claude-code/mcp',
              },
              {
                label: 'Claude custom connectors via remote MCP',
                href: 'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
              },
              {
                label: 'Cursor MCP docs',
                href: 'https://docs.cursor.com/context/model-context-protocol',
              },
              {
                label: 'MCP Streamable HTTP transport spec',
                href: 'https://modelcontextprotocol.io/specification/draft/basic/transports',
              },
            ].map((reference) => (
              <Link
                key={reference.href}
                href={reference.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border bg-background px-4 py-4 text-sm transition-colors hover:bg-muted/40"
              >
                <span className="flex items-center justify-between gap-3 font-medium text-foreground">
                  {reference.label}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="rounded-2xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
            Canonical Verto AI guide URL: <span className="font-medium text-foreground">{guideUrl}</span>
          </div>
        </section>
      </div>
    </main>
  )
}
