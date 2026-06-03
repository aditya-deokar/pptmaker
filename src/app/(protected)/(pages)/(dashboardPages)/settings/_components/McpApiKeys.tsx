'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowUpRight,
  Ban,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Key,
  KeyRound,
  Laptop,
  Loader2,
  Plus,
  Shield,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  generateMcpApiKey,
  listMcpApiKeys,
  revokeMcpApiKey,
  deleteMcpApiKey,
  type McpApiKeyInfo,
} from '@/actions/mcp-keys'
import {
  getMcpBearerHeaderValue,
  getMcpClientSetupExamples,
  getMcpDiscoveryUrl,
  getMcpEndpointUrl,
  getMcpGuideUrl,
  getPublicAppUrl,
  MCP_REMOTE_TOKEN_ENV_VAR,
  MCP_STDIO_TOKEN_ENV_VAR,
  MCP_STREAMABLE_HTTP_NOTES,
  type McpClientSetupExample,
} from '@/lib/mcp-client-guide'
import { cn } from '@/lib/utils'

function CodeSnippet({
  title,
  description,
  code,
  language = 'text',
  onCopy,
  copied,
  fileHint,
}: {
  title: string
  description: string
  code: string
  language?: string
  onCopy: () => void
  copied: boolean
  fileHint?: string
}) {
  return (
    <div className="space-y-3 rounded-[22px] border bg-background/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          {fileHint ? (
            <p className="text-xs text-muted-foreground">
              Suggested file:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{fileHint}</code>
            </p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={onCopy}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <pre className="overflow-x-auto rounded-2xl border border-border/70 bg-zinc-950 p-4 text-sm text-zinc-100">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  )
}

function CopyValueCard({
  label,
  value,
  description,
  onCopy,
  copied,
}: {
  label: string
  value: string
  description: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="rounded-[22px] border bg-background/85 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="break-all font-mono text-sm text-foreground">{value}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCopy} aria-label={`Copy ${label}`}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

function StepsCard({
  title,
  description,
  steps,
}: {
  title: string
  description: string
  steps: string[]
}) {
  return (
    <div className="space-y-4 rounded-[22px] border bg-background/80 p-4">
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step}
            className="flex gap-3 rounded-2xl border bg-background/70 p-3 text-sm leading-6 text-muted-foreground"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
              {index + 1}
            </div>
            <p>{step}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function McpApiKeys() {
  const [keys, setKeys] = useState<McpApiKeyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [revealOpen, setRevealOpen] = useState(false)
  const [revealedKey, setRevealedKey] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const appUrl = getPublicAppUrl()
  const endpointUrl = getMcpEndpointUrl(appUrl)
  const guideUrl = getMcpGuideUrl(appUrl)
  const discoveryUrl = getMcpDiscoveryUrl(appUrl)
  const bearerHeader = getMcpBearerHeaderValue()

  const {
    claudeCodeExample,
    cursorExample,
    genericExample,
    connectorExample,
    localExample,
  } = useMemo(() => {
    const examples = getMcpClientSetupExamples(appUrl)
    const findExample = (id: string) => examples.find((example) => example.id === id)

    return {
      claudeCodeExample: findExample('claude-code'),
      cursorExample: findExample('cursor'),
      genericExample: findExample('generic-http'),
      connectorExample: findExample('claude-connectors'),
      localExample: findExample('local-stdio'),
    }
  }, [appUrl])

  const remoteSetupTabs = useMemo(
    () =>
      [
        claudeCodeExample,
        cursorExample,
        genericExample,
        connectorExample,
      ].filter(Boolean) as McpClientSetupExample[],
    [claudeCodeExample, cursorExample, genericExample, connectorExample]
  )

  const fetchKeys = useCallback(async () => {
    const res = await listMcpApiKeys()

    if (res.status === 200 && res.data) {
      setKeys(res.data)
      setLoading(false)
      return
    }

    toast.error(res.error || 'Failed to fetch API keys')
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleGenerate = async () => {
    if (!keyName.trim()) {
      toast.error('Please enter a name for the key')
      return
    }

    setGenerating(true)
    const res = await generateMcpApiKey(keyName.trim())
    setGenerating(false)

    if (res.status === 200 && res.data) {
      setCreateOpen(false)
      setKeyName('')
      setRevealedKey(res.data.plaintextKey)
      setRevealOpen(true)
      setCopiedId(null)
      fetchKeys()
      return
    }

    toast.error(res.error || 'Failed to generate key')
  }

  const copyText = async (value: string, id: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedId(id)
      toast.success(successMessage)
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current))
      }, 2000)
    } catch {
      toast.error('Failed to copy. Please copy it manually.')
    }
  }

  const handleRevoke = async (keyId: string) => {
    setActionLoading(keyId)
    const res = await revokeMcpApiKey(keyId)
    setActionLoading(null)

    if (res.status === 200) {
      toast.success(res.message || 'Key revoked')
      fetchKeys()
      return
    }

    toast.error(res.error || 'Failed to revoke key')
  }

  const handleDelete = async (keyId: string) => {
    setActionLoading(keyId)
    const res = await deleteMcpApiKey(keyId)
    setActionLoading(null)

    if (res.status === 200) {
      toast.success(res.message || 'Key deleted')
      fetchKeys()
      return
    }

    toast.error(res.error || 'Failed to delete key')
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never'

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const activeKeys = keys.filter((key) => !key.isRevoked).length
  const revokedKeys = keys.length - activeKeys

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border bg-card/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate MCP API key</DialogTitle>
            <DialogDescription>
              Give this key a clear name so you can recognize the device or client later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                placeholder="e.g. Claude Code laptop"
                value={keyName}
                onChange={(event) => setKeyName(event.target.value)}
                maxLength={50}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleGenerate()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating || !keyName.trim()}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revealOpen} onOpenChange={setRevealOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              API key generated
            </DialogTitle>
            <DialogDescription>
              Copy this key now. For security reasons, you will not be able to view it again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-3">
              <code className="flex-1 break-all font-mono text-sm">{revealedKey}</code>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => copyText(revealedKey, 'revealed-key', 'API key copied to clipboard')}
              >
                {copiedId === 'revealed-key' ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
              Store the key somewhere safe. If you lose it, generate a new one and revoke the old
              key.
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm font-medium text-foreground">Next step</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Paste this key into the client setup below and point it at{' '}
                <span className="font-medium text-foreground">{endpointUrl}</span>.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" asChild>
              <Link href={guideUrl} target="_blank" rel="noreferrer">
                Open guide
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button onClick={() => setRevealOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="rounded-[30px] border bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,250,251,0.96))] p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <Badge className="rounded-full bg-emerald-500/12 px-3 py-1 text-emerald-700 hover:bg-emerald-500/12">
              Hosted MCP
            </Badge>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight">Connect your AI client fast</h3>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Generate a key, copy the hosted endpoint, and use one of the ready-made configs
                below for Claude Code, Cursor, or another MCP client.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700">
                {activeKeys} active
              </Badge>
              {revokedKeys > 0 ? (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700">
                  {revokedKeys} revoked
                </Badge>
              ) : null}
              <Badge variant="outline">Remote HTTP recommended</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Generate key
            </Button>
            <Button variant="outline" asChild>
              <Link href={guideUrl} target="_blank" rel="noreferrer">
                Full guide
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[26px] border bg-background/88 p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">Quick connect</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                {
                  title: '1. Create a key',
                  description: 'Use one key per device, IDE, or automation.',
                  icon: KeyRound,
                  accentClassName: 'bg-emerald-500/10 text-emerald-700',
                },
                {
                  title: '2. Paste the endpoint',
                  description: 'Point the client to the hosted URL on your domain.',
                  icon: Globe,
                  accentClassName: 'bg-sky-500/10 text-sky-700',
                },
                {
                  title: '3. Add the Bearer token',
                  description: 'Send the Verto key through the Authorization header.',
                  icon: Shield,
                  accentClassName: 'bg-amber-500/10 text-amber-700',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border bg-background/80 p-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-2xl',
                      item.accentClassName
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CopyValueCard
              label="MCP endpoint"
              value={endpointUrl}
              description="Use this in remote MCP clients such as Claude Code, Cursor, or hosted connectors."
              onCopy={() => copyText(endpointUrl, 'endpoint-url', 'MCP endpoint copied')}
              copied={copiedId === 'endpoint-url'}
            />
            <CopyValueCard
              label="Bearer header"
              value={`Authorization: ${bearerHeader}`}
              description="Remote HTTP clients should send your Verto key as a Bearer token."
              onCopy={() =>
                copyText(
                  `Authorization: ${bearerHeader}`,
                  'bearer-header',
                  'Bearer header copied'
                )
              }
              copied={copiedId === 'bearer-header'}
            />
            <CopyValueCard
              label="Remote env var"
              value={MCP_REMOTE_TOKEN_ENV_VAR}
              description="Keep the raw key in an environment variable instead of hard-coding it into client JSON."
              onCopy={() =>
                copyText(MCP_REMOTE_TOKEN_ENV_VAR, 'remote-env', 'Environment variable name copied')
              }
              copied={copiedId === 'remote-env'}
            />
            <CopyValueCard
              label="Discovery URL"
              value={discoveryUrl}
              description="Useful for discovery-aware clients and debugging protected-resource flows."
              onCopy={() => copyText(discoveryUrl, 'discovery-url', 'Discovery URL copied')}
              copied={copiedId === 'discovery-url'}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border bg-card/85 p-5 shadow-sm">
          <Tabs defaultValue={remoteSetupTabs[0]?.id ?? 'claude-code'} className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Quick setup</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Pick the client you are actually using, then copy the config and move on.
              </p>
            </div>

            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl p-1">
              {remoteSetupTabs.map((example) => (
                <TabsTrigger key={example.id} value={example.id} className="rounded-xl px-4">
                  {example.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {remoteSetupTabs.map((example) => (
              <TabsContent key={example.id} value={example.id} className="mt-0">
                {example.type === 'code' && example.code ? (
                  <CodeSnippet
                    title={example.title}
                    description={example.description}
                    code={example.code}
                    language={example.language}
                    fileHint={example.fileHint}
                    onCopy={() =>
                      copyText(example.code || '', `snippet-${example.id}`, `${example.title} copied`)
                    }
                    copied={copiedId === `snippet-${example.id}`}
                  />
                ) : null}

                {example.type === 'steps' && example.steps ? (
                  <StepsCard
                    title={example.title}
                    description={example.description}
                    steps={example.steps}
                  />
                ) : null}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border bg-card/85 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-sky-700" />
              <p className="font-medium text-foreground">Local repo fallback</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use stdio only when the client can launch the Verto repo locally. For the hosted app,
              remote HTTP is the better default.
            </p>

            {localExample?.code ? (
              <div className="mt-4">
                <CodeSnippet
                  title={localExample.title}
                  description={localExample.description}
                  code={localExample.code}
                  language={localExample.language}
                  onCopy={() =>
                    copyText(localExample.code || '', 'snippet-local-stdio', 'Local stdio config copied')
                  }
                  copied={copiedId === 'snippet-local-stdio'}
                />
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border bg-background/80 p-4 text-sm leading-6 text-muted-foreground">
              Pass{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{MCP_STDIO_TOKEN_ENV_VAR}</code>{' '}
              into the spawned process with the same Verto key you generated here.
            </div>
          </div>

          <div className="rounded-[28px] border bg-card/85 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-amber-700" />
              <p className="font-medium text-foreground">Before you test</p>
            </div>
            <div className="mt-4 space-y-3">
              {MCP_STREAMABLE_HTTP_NOTES.map((note) => (
                <div key={note} className="rounded-2xl border bg-background/80 p-4 text-sm leading-6 text-muted-foreground">
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border bg-card/85 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Your keys</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Revoke a key to disable it immediately. Delete it when you no longer need the record.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700">
              {activeKeys} active
            </Badge>
            <Badge variant="outline">{keys.length} total</Badge>
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Generate key
            </Button>
          </div>
        </div>

        {keys.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-[26px] border border-dashed py-14 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Key className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium">No MCP keys yet</h4>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Generate your first key, copy the hosted endpoint, and connect a client in a minute.
            </p>
            <Button className="mt-5 gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Generate first key
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className={cn(
                  'rounded-[24px] border p-4 transition-all',
                  key.isRevoked
                    ? 'border-border/70 bg-muted/40 opacity-75'
                    : 'border-border/70 bg-background/85 shadow-sm'
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={cn(
                        'mt-1 rounded-2xl p-3',
                        key.isRevoked
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-emerald-500/10 text-emerald-700'
                      )}
                    >
                      <Key className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-foreground">{key.name}</span>
                        {key.isRevoked ? (
                          <Badge variant="destructive">Revoked</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700">
                            Active
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                          {key.keyPrefix}........
                        </code>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Created {formatDate(key.createdAt)}
                        </span>
                        <span>Last used {formatDate(key.lastUsedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {!key.isRevoked ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="border-amber-500/20 text-amber-700 hover:bg-amber-500/10 hover:text-amber-700"
                            disabled={actionLoading === key.id}
                          >
                            {actionLoading === key.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                            Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke API key</AlertDialogTitle>
                            <AlertDialogDescription>
                              This immediately disables the key &quot;{key.name}&quot;. Any MCP client
                              using it will lose access until a new key is configured.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRevoke(key.id)}>
                              Revoke key
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={actionLoading === key.id}
                        >
                          {actionLoading === key.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete API key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Permanently delete the key &quot;{key.name}&quot;. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(key.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
