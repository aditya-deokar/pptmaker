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
    <div className="space-y-5">
      <section className="rounded-[28px] border bg-card/85 p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <Badge className="rounded-full border border-foreground/10 bg-background px-3 py-1 text-foreground hover:bg-background">
              Settings
            </Badge>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Clean controls for your workspace
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Keep appearance, AI routing, and external access in one focused place.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
            <div className="rounded-2xl border bg-background/90 p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-muted p-2">
                  <Palette className="h-4 w-4 text-foreground" />
                </div>
                <p className="text-sm font-medium">Theme</p>
              </div>
              <p className="mt-3 text-base font-semibold">{activeThemeLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">Switch instantly from the account tab.</p>
            </div>

            <div className="rounded-2xl border bg-background/90 p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-muted p-2">
                  <Cpu className="h-4 w-4 text-foreground" />
                </div>
                <p className="text-sm font-medium">Runtime</p>
              </div>
              <p className="mt-3 text-base font-semibold">Unified AI</p>
              <p className="mt-1 text-sm text-muted-foreground">One setup for presentations and mobile design.</p>
            </div>

            <div className="rounded-2xl border bg-background/90 p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-muted p-2">
                  <KeyRound className="h-4 w-4 text-foreground" />
                </div>
                <p className="text-sm font-medium">Access</p>
              </div>
              <p className="mt-3 text-base font-semibold">Hosted MCP</p>
              <p className="mt-1 text-sm text-muted-foreground">Keys and client setup stay together.</p>
            </div>
          </div>
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as (typeof settingsSections)[number]["value"])
        }
        className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start"
      >
        <aside className="space-y-4 xl:sticky xl:top-4">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-[28px] border bg-card/85 p-2 shadow-sm">
            {settingsSections.map((section) => {
              const Icon = section.icon;

              return (
                <TabsTrigger
                  key={section.value}
                  value={section.value}
                  className={cn(
                    "h-auto w-full justify-start rounded-[22px] px-4 py-4 text-left",
                    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  )}
                >
                  <div className="flex w-full items-start gap-3">
                    <div className="rounded-2xl bg-muted p-2.5">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{section.label}</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="rounded-[24px] border bg-card/85 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Current section
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">{activeSection.label}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {activeSection.description}
            </p>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <TabsContent value="account" className="mt-0 space-y-6">
            <section className="rounded-[30px] border bg-card/85 p-6 shadow-sm">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Account</h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Keep the workspace comfortable, then jump into your secure account manager for
                  profile, password, and sign-in changes.
                </p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[26px] border bg-background/90 p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-muted p-2.5">
                      <Palette className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Appearance</p>
                      <p className="text-sm text-muted-foreground">
                        Choose how Verto looks while you work.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      const isActive = activeTheme === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTheme(option.value)}
                          className={cn(
                            "rounded-2xl border p-4 text-left transition-all",
                            "hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-sm",
                            isActive
                              ? "border-foreground/15 bg-foreground text-background shadow-sm"
                              : "bg-background text-foreground"
                          )}
                        >
                          <div
                            className={cn(
                              "inline-flex rounded-xl p-2",
                              isActive ? "bg-white/10" : "bg-muted"
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
                              "mt-1 text-xs leading-5",
                              isActive ? "text-background/70" : "text-muted-foreground"
                            )}
                          >
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[26px] border bg-background/90 p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-muted p-2.5">
                      <ShieldCheck className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Account & security</p>
                      <p className="text-sm text-muted-foreground">
                        Managed through your secure account portal.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 rounded-2xl border bg-muted/25 p-4">
                    <div className="flex items-start gap-3">
                      <UserRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <p className="text-sm leading-6 text-muted-foreground">
                        Update your name, photo, email, and connected sign-in methods.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <p className="text-sm leading-6 text-muted-foreground">
                        Review password, sessions, and account security from one place.
                      </p>
                    </div>
                  </div>

                  <Button
                    className="mt-5 h-11 w-full rounded-2xl"
                    onClick={handleOpenAccountManager}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Open account manager
                  </Button>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="ai-config" className="mt-0 space-y-4">
            <div className="space-y-1 px-1">
              <h2 className="text-xl font-semibold tracking-tight">AI Runtime</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Manage your provider keys, preferred routing, and shared runtime behavior for the
                whole workspace.
              </p>
            </div>
            <AiConfiguration />
          </TabsContent>

          <TabsContent value="mcp-keys" className="mt-0 space-y-4">
            <div className="space-y-1 px-1">
              <h2 className="text-xl font-semibold tracking-tight">MCP Access</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Create keys and connect hosted Verto AI tools to Claude, Cursor, and other MCP
                clients.
              </p>
            </div>
            <McpApiKeys />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
