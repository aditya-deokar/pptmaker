'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Key,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import { AiProvider } from '@/generated/prisma'
import {
  deleteUserAiKey,
  getUserAiConfiguration,
  saveUserAiKey,
  testAiKeyConnection,
  updateUserAiDefaultProvider,
  type ProviderConfiguration,
  type UserAiConfiguration,
} from '@/actions/ai-keys'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const providerFieldDefaults: Record<AiProvider, string> = {
  [AiProvider.GOOGLE]: '',
  [AiProvider.OPENAI]: '',
  [AiProvider.GROQ]: '',
}

function formatDate(date: string | null) {
  if (!date) return 'Never'

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getProviderState(
  providerConfig: ProviderConfiguration,
  configuration: UserAiConfiguration
) {
  if (providerConfig.usable && configuration.businessModel.byokActive) {
    return {
      label: 'Ready now',
      description: 'Can power new generations immediately',
      badgeClassName:
        'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/12',
      iconClassName: 'bg-emerald-500/12 text-emerald-600',
      panelClassName: 'border-emerald-500/20 bg-emerald-500/6',
    }
  }

  if (providerConfig.usable) {
    return {
      label: 'Saved for later',
      description: 'Stored and ready once BYOK is active',
      badgeClassName:
        'border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10',
      iconClassName: 'bg-sky-500/12 text-sky-600',
      panelClassName: 'border-sky-500/20 bg-sky-500/5',
    }
  }

  if (providerConfig.configured) {
    return {
      label: 'Needs attention',
      description: 'Stored key needs to be revalidated',
      badgeClassName:
        'border-amber-500/20 bg-amber-500/12 text-amber-700 hover:bg-amber-500/12',
      iconClassName: 'bg-amber-500/12 text-amber-600',
      panelClassName: 'border-amber-500/20 bg-amber-500/5',
    }
  }

  return {
    label: 'Not connected',
    description: 'Add a key to start using this provider',
    badgeClassName:
      'border-border bg-muted/70 text-muted-foreground hover:bg-muted/70',
    iconClassName: 'bg-muted text-muted-foreground',
    panelClassName: 'border-border bg-muted/20',
  }
}

function getProviderSelection(configuration: UserAiConfiguration) {
  return (
    configuration.defaultProvider ??
    configuration.providers.find((provider) => provider.configured)?.provider ??
    configuration.providers[0]?.provider ??
    AiProvider.GOOGLE
  )
}

export function AiConfiguration() {
  const [configuration, setConfiguration] = useState<UserAiConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProvider, setSavingProvider] = useState<AiProvider | null>(null)
  const [testingProvider, setTestingProvider] = useState<AiProvider | null>(null)
  const [deletingProvider, setDeletingProvider] = useState<AiProvider | null>(null)
  const [savingDefaultProvider, setSavingDefaultProvider] = useState(false)
  const [defaultProviderValue, setDefaultProviderValue] = useState<string>('automatic')
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(AiProvider.GOOGLE)
  const [inputKeys, setInputKeys] =
    useState<Record<AiProvider, string>>(providerFieldDefaults)
  const [inputModels, setInputModels] =
    useState<Record<AiProvider, string>>(providerFieldDefaults)

  const fetchConfiguration = async () => {
    const response = await getUserAiConfiguration()

    if (response.status === 200 && response.data) {
      setConfiguration(response.data)
      setDefaultProviderValue(response.data.defaultProvider ?? 'automatic')
      setSelectedProvider((current) => {
        const stillExists = response.data.providers.some((provider) => provider.provider === current)
        return stillExists ? current : getProviderSelection(response.data)
      })
      setInputModels({
        [AiProvider.GOOGLE]:
          response.data.providers.find((provider) => provider.provider === AiProvider.GOOGLE)
            ?.modelName ?? '',
        [AiProvider.OPENAI]:
          response.data.providers.find((provider) => provider.provider === AiProvider.OPENAI)
            ?.modelName ?? '',
        [AiProvider.GROQ]:
          response.data.providers.find((provider) => provider.provider === AiProvider.GROQ)
            ?.modelName ?? '',
      })
      return
    }

    toast.error(response.error || 'Failed to load AI configuration')
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchConfiguration()
      setLoading(false)
    }

    load()
  }, [])

  const handleSave = async (providerConfig: ProviderConfiguration) => {
    const nextKey = inputKeys[providerConfig.provider].trim()
    const nextModel = inputModels[providerConfig.provider].trim()

    if (!nextKey && !providerConfig.configured) {
      toast.error(`Enter your ${providerConfig.keyLabel.toLowerCase()} first.`)
      return
    }

    setSavingProvider(providerConfig.provider)
    const response = await saveUserAiKey({
      provider: providerConfig.provider,
      apiKey: nextKey || undefined,
      modelName: nextModel || undefined,
    })
    setSavingProvider(null)

    if (response.status === 200) {
      toast.success(response.message || 'API key saved successfully')
      setInputKeys((current) => ({
        ...current,
        [providerConfig.provider]: '',
      }))
      await fetchConfiguration()
      return
    }

    toast.error(response.error || 'Failed to save API key')
  }

  const handleDelete = async (providerConfig: ProviderConfiguration) => {
    if (!confirm(`Remove your ${providerConfig.label} key from Verto AI?`)) {
      return
    }

    setDeletingProvider(providerConfig.provider)
    const response = await deleteUserAiKey(providerConfig.provider)
    setDeletingProvider(null)

    if (response.status === 200) {
      toast.success(response.message || 'API key deleted successfully')
      setInputKeys((current) => ({
        ...current,
        [providerConfig.provider]: '',
      }))
      setInputModels((current) => ({
        ...current,
        [providerConfig.provider]: '',
      }))
      await fetchConfiguration()
      return
    }

    toast.error(response.error || 'Failed to delete API key')
  }

  const handleTest = async (providerConfig: ProviderConfiguration) => {
    const nextKey = inputKeys[providerConfig.provider].trim()
    const nextModel = inputModels[providerConfig.provider].trim()

    if (!nextKey) {
      toast.error('Paste a key to test first. Save will validate a stored key for you.')
      return
    }

    setTestingProvider(providerConfig.provider)
    const response = await testAiKeyConnection({
      provider: providerConfig.provider,
      apiKey: nextKey,
      modelName: nextModel || undefined,
    })
    setTestingProvider(null)

    if (response.status === 200) {
      toast.success(response.message || 'Connection successful')
      if (response.data?.modelName && !nextModel) {
        setInputModels((current) => ({
          ...current,
          [providerConfig.provider]: response.data!.modelName,
        }))
      }
      return
    }

    toast.error(response.error || 'Connection test failed')
  }

  const handleSaveDefaultProvider = async () => {
    const nextDefaultProvider =
      defaultProviderValue === 'automatic'
        ? null
        : (defaultProviderValue as AiProvider)

    setSavingDefaultProvider(true)
    const response = await updateUserAiDefaultProvider(nextDefaultProvider)
    setSavingDefaultProvider(false)

    if (response.status === 200) {
      toast.success(response.message || 'Default provider updated')
      await fetchConfiguration()
      return
    }

    toast.error(response.error || 'Failed to update default provider')
  }

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border bg-card/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!configuration) {
    return (
      <div className="rounded-[28px] border border-dashed p-6 text-sm text-muted-foreground">
        Unable to load your AI configuration right now.
      </div>
    )
  }

  const canSaveDefaultProvider =
    (configuration.defaultProvider ?? 'automatic') !== defaultProviderValue
  const usableProviders = configuration.providers.filter((provider) => provider.usable)
  const connectedProviders = configuration.providers.filter((provider) => provider.configured)
  const selectedProviderConfig =
    configuration.providers.find((provider) => provider.provider === selectedProvider) ??
    configuration.providers[0]
  const selectedProviderState = getProviderState(selectedProviderConfig, configuration)
  const fallbackProviderLabel =
    configuration.providers.find(
      (provider) => provider.provider === configuration.systemFallback.provider
    )?.label ?? configuration.systemFallback.provider
  const activeProviderLabel =
    configuration.defaultProvider &&
    configuration.providers.find((provider) => provider.provider === configuration.defaultProvider)
      ?.label
  const heroTitle = configuration.businessModel.byokActive
    ? 'Your own model routing is active'
    : configuration.businessModel.hasUnlimitedPlan
      ? 'Connect a provider when you want more control'
      : 'Save your key now and let Verto switch over later'
  const heroDescription = configuration.businessModel.byokActive
    ? 'New presentation and mobile-design generations can use your saved provider instead of the hosted default.'
    : configuration.businessModel.hasUnlimitedPlan
      ? 'Choose the provider and model you trust, then make it your default runtime whenever you are ready.'
      : `You still have ${configuration.businessModel.remainingFreeProjects} included project${configuration.businessModel.remainingFreeProjects === 1 ? '' : 's'} before BYOK takes over automatically.`

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_36%),linear-gradient(135deg,rgba(250,250,250,0.98),rgba(244,244,245,0.9))] p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
          <div className="space-y-5">
            <div className="space-y-3">
              <Badge className="rounded-full border border-foreground/10 bg-background/90 px-3 py-1 text-foreground shadow-sm hover:bg-background/90">
                Bring Your Own Model
              </Badge>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight">{heroTitle}</h3>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {heroDescription}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border bg-background/85 p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Current status
                </p>
                <p className="mt-3 text-lg font-semibold">
                  {configuration.businessModel.byokActive ? 'BYOK live' : 'Hosted default'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {configuration.businessModel.byokActive
                    ? 'Your saved provider can be used right now.'
                    : 'Verto will keep using the hosted runtime until BYOK is active.'}
                </p>
              </div>

              <div className="rounded-2xl border bg-background/85 p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Connected
                </p>
                <p className="mt-3 text-lg font-semibold">
                  {connectedProviders.length} of {configuration.providers.length} providers
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {usableProviders.length > 0
                    ? `${usableProviders.length} key${usableProviders.length === 1 ? '' : 's'} are ready to route.`
                    : 'Add one provider to unlock custom routing.'}
                </p>
              </div>

              <div className="rounded-2xl border bg-background/85 p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Routing
                </p>
                <p className="mt-3 text-lg font-semibold">
                  {activeProviderLabel || 'Automatic'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Falls back to {fallbackProviderLabel} {configuration.systemFallback.modelName}.
                </p>
              </div>
            </div>

            {configuration.compatibility.message ? (
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/8 px-4 py-3 text-sm text-sky-900">
                {configuration.compatibility.message}
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border bg-background/90 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-foreground p-2 text-background">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Primary routing</p>
                <p className="text-sm text-muted-foreground">
                  Choose how Verto should prefer your saved providers.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Label htmlFor="default-provider">Default provider</Label>
              <Select value={defaultProviderValue} onValueChange={setDefaultProviderValue}>
                <SelectTrigger
                  id="default-provider"
                  className="h-11 rounded-2xl"
                  disabled={!configuration.compatibility.supportsDefaultProvider}
                >
                  <SelectValue placeholder="Choose a default provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  {usableProviders.map((provider) => (
                    <SelectItem key={provider.provider} value={provider.provider}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-muted-foreground">
                {configuration.compatibility.supportsDefaultProvider
                  ? 'Automatic keeps routing flexible and falls back safely when a provider is unavailable.'
                  : 'Default provider selection will unlock after the latest AI settings upgrade finishes syncing.'}
              </p>
            </div>

            <div className="mt-5 rounded-2xl border bg-muted/30 p-4">
              <p className="text-sm font-medium">Used across Verto</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Presentations, streamable slides, MCP generation, and mobile design all use this
                same saved runtime setup.
              </p>
            </div>

            <Button
              className="mt-5 h-11 w-full rounded-2xl"
              variant="outline"
              onClick={handleSaveDefaultProvider}
              disabled={
                !configuration.compatibility.supportsDefaultProvider ||
                !canSaveDefaultProvider ||
                savingDefaultProvider
              }
            >
              {savingDefaultProvider ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save routing preference
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold">Providers</h4>
            <p className="text-sm text-muted-foreground">
              Pick one provider to manage. Everything else stays out of the way.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {selectedProviderConfig.label}
          </Badge>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {configuration.providers.map((providerConfig) => {
            const providerState = getProviderState(providerConfig, configuration)
            const isSelected = providerConfig.provider === selectedProvider

            return (
              <button
                key={providerConfig.provider}
                type="button"
                onClick={() => setSelectedProvider(providerConfig.provider)}
                className={cn(
                  'rounded-[26px] border bg-card/80 p-4 text-left shadow-sm transition-all',
                  'hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md',
                  isSelected && 'border-foreground/20 bg-background shadow-md ring-1 ring-foreground/10'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn('rounded-2xl p-2.5', providerState.iconClassName)}>
                      {providerConfig.usable ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{providerConfig.label}</p>
                        {providerConfig.isDefault ? (
                          <Badge variant="secondary" className="rounded-full">
                            Default
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {providerState.description}
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className={cn('rounded-full border', providerState.badgeClassName)}>
                    {providerState.label}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    {providerConfig.modelName || providerConfig.defaultModel}
                  </Badge>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section
        className={cn(
          'rounded-[30px] border p-6 shadow-sm',
          selectedProviderState.panelClassName
        )}
      >
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-xl font-semibold">{selectedProviderConfig.label}</h4>
                  <Badge
                    className={cn('rounded-full border', selectedProviderState.badgeClassName)}
                  >
                    {selectedProviderState.label}
                  </Badge>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {selectedProviderConfig.description}
                </p>
              </div>

              {selectedProviderConfig.configured ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(selectedProviderConfig)}
                  disabled={deletingProvider === selectedProviderConfig.provider}
                >
                  {deletingProvider === selectedProviderConfig.provider ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${selectedProviderConfig.provider}-key`}>
                {selectedProviderConfig.keyLabel}
              </Label>
              <div className="relative">
                <Input
                  id={`${selectedProviderConfig.provider}-key`}
                  type="password"
                  placeholder={
                    selectedProviderConfig.configured
                      ? 'Stored securely. Paste a new key only if you want to replace it.'
                      : `Enter your ${selectedProviderConfig.keyLabel.toLowerCase()}`
                  }
                  className="h-12 rounded-2xl pr-10"
                  value={inputKeys[selectedProviderConfig.provider]}
                  onChange={(event) =>
                    setInputKeys((current) => ({
                      ...current,
                      [selectedProviderConfig.provider]: event.target.value,
                    }))
                  }
                />
                <Key className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {selectedProviderConfig.configured
                  ? 'Your current key stays in place until you replace it with a new one.'
                  : 'Keys are encrypted before they are stored in your workspace.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`${selectedProviderConfig.provider}-model`}>
                  Preferred model name
                </Label>
                <Input
                  id={`${selectedProviderConfig.provider}-model`}
                  className="h-12 rounded-2xl"
                  placeholder={`Leave blank to use ${selectedProviderConfig.defaultModel}`}
                  value={inputModels[selectedProviderConfig.provider]}
                  disabled={!configuration.compatibility.supportsPreferredModelName}
                  onChange={(event) =>
                    setInputModels((current) => ({
                      ...current,
                      [selectedProviderConfig.provider]: event.target.value,
                    }))
                  }
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  {configuration.compatibility.supportsPreferredModelName
                    ? 'Use the exact model id from your provider account if you want something other than the default.'
                    : 'Saved model names will appear here after the latest AI settings upgrade finishes syncing.'}
                </p>
              </div>

              <div className="rounded-2xl border bg-background/80 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-medium">Recommended models</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedProviderConfig.recommendedModels.map((model) => (
                    <Button
                      key={model.value}
                      type="button"
                      size="sm"
                      variant={
                        inputModels[selectedProviderConfig.provider] === model.value
                          ? 'default'
                          : 'outline'
                      }
                      className="rounded-full"
                      disabled={!configuration.compatibility.supportsPreferredModelName}
                      onClick={() =>
                        setInputModels((current) => ({
                          ...current,
                          [selectedProviderConfig.provider]: model.value,
                        }))
                      }
                    >
                      {model.value}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {selectedProviderConfig.lastValidationError ? (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
                Last validation note: {selectedProviderConfig.lastValidationError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-2xl"
                onClick={() => handleTest(selectedProviderConfig)}
                disabled={
                  testingProvider === selectedProviderConfig.provider ||
                  inputKeys[selectedProviderConfig.provider].trim().length === 0
                }
              >
                {testingProvider === selectedProviderConfig.provider ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Test key
              </Button>

              <Button
                className="h-12 flex-1 rounded-2xl"
                onClick={() => handleSave(selectedProviderConfig)}
                disabled={
                  savingProvider === selectedProviderConfig.provider ||
                  (!selectedProviderConfig.configured &&
                    inputKeys[selectedProviderConfig.provider].trim().length === 0)
                }
              >
                {savingProvider === selectedProviderConfig.provider ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {selectedProviderConfig.configured ? 'Save changes' : 'Save provider'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[26px] border bg-background/88 p-5 shadow-sm">
              <p className="text-sm font-medium">What Verto will use</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Model
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {selectedProviderConfig.modelName || selectedProviderConfig.defaultModel}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Validation
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {configuration.compatibility.supportsValidationMetadata
                      ? formatDate(selectedProviderConfig.validatedAt)
                      : 'Available after sync'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Last used
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {configuration.compatibility.supportsLastUsedAt
                      ? formatDate(selectedProviderConfig.lastUsedAt)
                      : 'Available after sync'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border bg-background/88 p-5 shadow-sm">
              <p className="text-sm font-medium">Routing summary</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {selectedProviderConfig.isDefault
                  ? `${selectedProviderConfig.label} is currently your preferred provider.`
                  : configuration.defaultProvider
                    ? `${selectedProviderConfig.label} is available, but ${activeProviderLabel} is currently preferred.`
                    : `${selectedProviderConfig.label} can be chosen automatically when it is your best working option.`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full">
                  {configuration.businessModel.byokActive ? 'BYOK active' : 'Hosted mode'}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Fallback: {fallbackProviderLabel}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
