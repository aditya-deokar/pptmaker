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
import { Skeleton } from '@/components/ui/skeleton'

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
  description?: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="flex flex-col justify-between rounded-[24px] border bg-background/50 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-foreground/20 hover:bg-background/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
          <p className="truncate font-mono text-sm text-foreground" title={value}>{value}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCopy} aria-label={`Copy ${label}`} className="h-8 w-8 shrink-0">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      {description && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{description}</p>}
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
      <div className="space-y-6">
        <div className="rounded-[32px] border bg-card/40 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-[104px] rounded-[24px]" />
            <Skeleton className="h-[104px] rounded-[24px]" />
            <Skeleton className="h-[104px] rounded-[24px]" />
            <Skeleton className="h-[104px] rounded-[24px]" />
          </div>
        </div>

        <div className="rounded-[32px] border bg-card/40 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-full xl:w-[400px] rounded-2xl" />
          </div>
          <Skeleton className="mt-6 h-[200px] w-full rounded-[22px]" />
        </div>

        <div className="rounded-[32px] border bg-card/40 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-[160px] rounded-[24px]" />
            <Skeleton className="h-[160px] rounded-[24px]" />
            <Skeleton className="h-[160px] rounded-[24px]" />
          </div>
        </div>
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

      <section className="rounded-[32px] border bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] p-6 shadow-sm backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight">Connection Details</h3>
            <p className="text-sm text-muted-foreground">Endpoints and tokens for remote clients.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700">
                {activeKeys} active
              </Badge>
              {revokedKeys > 0 && (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700">
                  {revokedKeys} revoked
                </Badge>
              )}
            </div>
            <Button size="sm" variant="outline" asChild className="rounded-full">
              <Link href={guideUrl} target="_blank" rel="noreferrer">
                Docs <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CopyValueCard
            label="MCP Endpoint"
            value={endpointUrl}
            onCopy={() => copyText(endpointUrl, 'endpoint-url', 'MCP endpoint copied')}
            copied={copiedId === 'endpoint-url'}
          />
          <CopyValueCard
            label="Bearer Header"
            value={`Authorization: ${bearerHeader}`}
            onCopy={() => copyText(`Authorization: ${bearerHeader}`, 'bearer-header', 'Bearer header copied')}
            copied={copiedId === 'bearer-header'}
          />
          <CopyValueCard
            label="Remote Env Var"
            value={MCP_REMOTE_TOKEN_ENV_VAR}
            onCopy={() => copyText(MCP_REMOTE_TOKEN_ENV_VAR, 'remote-env', 'Environment variable name copied')}
            copied={copiedId === 'remote-env'}
          />
          <CopyValueCard
            label="Discovery URL"
            value={discoveryUrl}
            onCopy={() => copyText(discoveryUrl, 'discovery-url', 'Discovery URL copied')}
            copied={copiedId === 'discovery-url'}
          />
        </div>
      </section>

      <section className="rounded-[32px] border bg-card/40 p-6 shadow-sm backdrop-blur-xl md:p-8">
        <Tabs defaultValue={remoteSetupTabs[0]?.id ?? 'claude-code'} className="space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight">Client Configurations</h3>
              <p className="text-sm text-muted-foreground">
                Copy a pre-made configuration for your client.
              </p>
            </div>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 rounded-2xl bg-background/50 p-1.5 xl:w-auto">
              {remoteSetupTabs.map((example) => (
                <TabsTrigger key={example.id} value={example.id} className="rounded-xl px-4 py-2">
                  {example.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="mt-2">
            {remoteSetupTabs.map((example) => (
              <TabsContent key={example.id} value={example.id} className="mt-0 outline-none">
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
          </div>
        </Tabs>
      </section>

      <section className="rounded-[32px] border bg-card/40 p-6 shadow-sm backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight">Access Keys</h3>
            <p className="text-sm text-muted-foreground">
              Manage keys for your external clients.
            </p>
          </div>

          <Button className="w-full gap-2 rounded-full sm:w-auto" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Generate key
          </Button>
        </div>

        {keys.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-[24px] border border-dashed py-12 text-center bg-background/40">
            <div className="mb-4 rounded-2xl bg-muted/50 p-4">
              <Key className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="text-base font-medium">No keys generated</h4>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Create a key to connect your AI client.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className={cn(
                  'flex flex-col justify-between rounded-[24px] border p-5 transition-all',
                  key.isRevoked
                    ? 'border-border/50 bg-muted/20 opacity-70'
                    : 'bg-background/50 shadow-sm hover:border-foreground/20 hover:shadow-md backdrop-blur-sm'
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("shrink-0 rounded-xl p-2", key.isRevoked ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700")}>
                        <Key className="h-4 w-4" />
                      </div>
                      <span className="truncate font-medium text-foreground">{key.name}</span>
                    </div>
                    {key.isRevoked && <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">Revoked</Badge>}
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-[11px]">{key.keyPrefix}••••••••</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Created {formatDate(key.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/50 pt-4">
                  {!key.isRevoked && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-amber-600 hover:bg-amber-500/10 hover:text-amber-700" disabled={actionLoading === key.id}>
                          {actionLoading === key.id ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Ban className="mr-1.5 h-3 w-3" />}
                          Revoke
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke API key</AlertDialogTitle>
                          <AlertDialogDescription>This disables the key "{key.name}". Clients using it will lose access.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevoke(key.id)}>Revoke key</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={actionLoading === key.id}>
                        {actionLoading === key.id ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1.5 h-3 w-3" />}
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete API key</AlertDialogTitle>
                        <AlertDialogDescription>Permanently delete "{key.name}". This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(key.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
