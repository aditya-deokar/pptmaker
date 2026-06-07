"use client";

import { useEffect, useMemo, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  Cpu,
  KeyRound,
  MonitorCog,
  MoonStar,
  Palette,
  PlugZap,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UserRound,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AiConfiguration } from "./_components/AiConfiguration";
import { McpApiKeys } from "./_components/McpApiKeys";

const settingsSections = [
  {
    value: "account",
    label: "Account",
    description: "Appearance, profile, and security access",
    icon: UserRound,
  },
  {
    value: "ai-config",
    label: "AI Runtime",
    description: "Bring your own model and routing preferences",
    icon: Sparkles,
  },
  {
    value: "mcp-keys",
    label: "MCP Access",
    description: "Connect Claude, Cursor, and other clients",
    icon: PlugZap,
  },
] as const;

const themeOptions = [
  {
    value: "light",
    label: "Light",
    description: "Bright and clean for daytime work",
    icon: SunMedium,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Focused contrast for longer sessions",
    icon: MoonStar,
  },
  {
    value: "system",
    label: "System",
    description: "Matches your device automatically",
    icon: MonitorCog,
  },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { openUserProfile } = useClerk();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] =
    useState<(typeof settingsSections)[number]["value"]>("account");

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? theme ?? "system" : "system";
  const activeThemeLabel = useMemo(
    () =>
      themeOptions.find((option) => option.value === activeTheme)?.label ?? "System",
    [activeTheme]
  );
  const activeSection = useMemo(
    () => settingsSections.find((section) => section.value === activeTab) ?? settingsSections[0],
    [activeTab]
  );

  const handleOpenAccountManager = () => {
    openUserProfile();
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[32px] border bg-card/40 p-6 shadow-sm backdrop-blur-xl md:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-4">
            <Badge className="rounded-full border border-foreground/10 bg-background/50 px-3 py-1 text-foreground backdrop-blur-md hover:bg-background/80">
              Settings
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Clean controls for your workspace
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                Keep appearance, AI routing, and external access in one focused place.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[600px]">
            <div className="rounded-[24px] border bg-background/50 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-background/80">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-muted/50 p-2.5">
                  <Palette className="h-4 w-4 text-foreground" />
                </div>
                <p className="text-sm font-medium">Theme</p>
              </div>
              <div className="mt-4">
                <p className="text-base font-semibold">{activeThemeLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">Switch from account tab</p>
              </div>
            </div>

            <div className="rounded-[24px] border bg-background/50 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-background/80">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-muted/50 p-2.5">
                  <Cpu className="h-4 w-4 text-foreground" />
                </div>
                <p className="text-sm font-medium">Runtime</p>
              </div>
              <div className="mt-4">
                <p className="text-base font-semibold">Unified AI</p>
                <p className="mt-1 text-sm text-muted-foreground">One setup for all apps</p>
              </div>
            </div>

            <div className="rounded-[24px] border bg-background/50 p-5 shadow-sm backdrop-blur-sm transition-all hover:bg-background/80">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-muted/50 p-2.5">
                  <KeyRound className="h-4 w-4 text-foreground" />
                </div>
                <p className="text-sm font-medium">Access</p>
              </div>
              <div className="mt-4">
                <p className="text-base font-semibold">Hosted MCP</p>
                <p className="mt-1 text-sm text-muted-foreground">Keys stay together</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as (typeof settingsSections)[number]["value"])
        }
        className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)] xl:items-start"
      >
        <aside className="space-y-4 xl:sticky xl:top-6">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1.5 rounded-[32px] border bg-card/40 p-3 shadow-sm backdrop-blur-xl">
            {settingsSections.map((section) => {
              const Icon = section.icon;

              return (
                <TabsTrigger
                  key={section.value}
                  value={section.value}
                  className={cn(
                    "h-auto w-full justify-start whitespace-normal rounded-[24px] px-4 py-3.5 text-left transition-all",
                    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border"
                  )}
                >
                  <div className="flex w-full min-w-0 items-start gap-3.5">
                    <div className="shrink-0 rounded-2xl bg-muted/50 p-2.5">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium">{section.label}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="rounded-[28px] border bg-card/40 p-5 shadow-sm backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Current section
            </p>
            <div className="mt-4">
              <p className="text-sm font-medium text-foreground">{activeSection.label}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {activeSection.description}
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <TabsContent value="account" className="mt-0 space-y-6 outline-none">
            <section className="rounded-[32px] border bg-card/40 p-6 shadow-sm backdrop-blur-xl md:p-8">
              <div className="space-y-2.5">
                <h2 className="text-2xl font-semibold tracking-tight">Account</h2>
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  Keep the workspace comfortable, then jump into your secure account manager for
                  profile, password, and sign-in changes.
                </p>
              </div>

              <div className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[28px] border bg-background/50 p-6 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="rounded-2xl bg-muted/50 p-3">
                      <Palette className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-foreground">Appearance</p>
                      <p className="text-sm text-muted-foreground">
                        Choose how Verto looks while you work.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      const isActive = activeTheme === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTheme(option.value)}
                          className={cn(
                            "group rounded-[20px] border p-4 text-left transition-all duration-200",
                            "hover:-translate-y-1 hover:border-foreground/20 hover:shadow-md",
                            isActive
                              ? "border-foreground/20 bg-foreground text-background shadow-md"
                              : "bg-background/50 text-foreground"
                          )}
                        >
                          <div
                            className={cn(
                              "inline-flex rounded-xl p-2.5 transition-colors",
                              isActive ? "bg-background/20" : "bg-muted/50 group-hover:bg-muted"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4",
                                isActive ? "text-background" : "text-foreground"
                              )}
                            />
                          </div>
                          <p className="mt-4 text-sm font-medium">{option.label}</p>
                          <p
                            className={cn(
                              "mt-1.5 text-xs leading-relaxed",
                              isActive ? "text-background/80" : "text-muted-foreground"
                            )}
                          >
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-[28px] border bg-background/50 p-6 shadow-sm backdrop-blur-sm">
                  <div>
                    <div className="flex items-center gap-3.5">
                      <div className="rounded-2xl bg-muted/50 p-3">
                        <ShieldCheck className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-foreground">Account & security</p>
                        <p className="text-sm text-muted-foreground">
                          Managed through your secure account portal.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4 rounded-[20px] border bg-muted/30 p-5">
                      <div className="flex items-start gap-3">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          Update your name, photo, email, and connected sign-in methods.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          Review password, sessions, and account security from one place.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="mt-6 h-12 w-full rounded-[20px] text-base font-medium transition-all hover:scale-[1.02]"
                    onClick={handleOpenAccountManager}
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Open account manager
                  </Button>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="ai-config" className="mt-0 space-y-6 outline-none">
            <section className="rounded-[32px] border bg-card/40 p-6 shadow-sm backdrop-blur-xl md:p-8">
              <div className="space-y-2.5">
                <h2 className="text-2xl font-semibold tracking-tight">AI Runtime</h2>
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  Manage your provider keys, preferred routing, and shared runtime behavior for the
                  whole workspace.
                </p>
              </div>
              <div className="mt-8">
                <AiConfiguration />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="mcp-keys" className="mt-0 space-y-6 outline-none">
            <section className="rounded-[32px] border bg-card/40 p-6 shadow-sm backdrop-blur-xl md:p-8">
              <div className="space-y-2.5">
                <h2 className="text-2xl font-semibold tracking-tight">MCP Access</h2>
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  Create keys and connect hosted Verto AI tools to Claude, Cursor, and other MCP
                  clients.
                </p>
              </div>
              <div className="mt-8">
                <McpApiKeys />
              </div>
            </section>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
