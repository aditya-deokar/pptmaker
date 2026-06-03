"use client";

import { ChevronDown } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { buySubscription } from "@/actions/payment";
import { ManageSubscription } from "@/components/global/subscription";
import { UsageProgress } from "@/components/global/UsageProgress";
import type { AuthenticatedAppUser } from "@/lib/user-compat";

export function NavFooter({ prismaUser }: { prismaUser: AuthenticatedAppUser }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpgrading = async () => {
    setLoading(true);
    try {
      const res = await buySubscription(prismaUser.id);

      if (res.status !== 200) {
        throw new Error("Failed to upgrade subscription");
      }

      router.push(res.url);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex flex-col gap-y-6 items-start group-data-[collapsible=icon]:hidden px-2">
          {/* Usage Statistics */}
          <UsageProgress />

          {/* Subscription Management */}
          {prismaUser.subscription ? (
            <div className="flex flex-col items-start p-2 pb-3 gap-4 bg-background-80 w-full">
              <div className="flex flex-col items-start gap-1">
                <p className="text-base font-bold">
                  <span className="text-vivid">Creative AI</span> Pro
                </p>
                <span className="text-sm dark:text-secondary">
                  You have full access to all features
                </span>
              </div>
              <ManageSubscription 
                variant="outline" 
                size="sm" 
                className="w-full"
              />
            </div>
          ) : (
            <div className="flex flex-col items-start p-2 pb-3 gap-4 bg-background-80">
              <div className="flex flex-col items-start gap-1">
                <p className="text-base font-bold">
                  Get <span className="text-vivid">Creative AI</span>
                </p>
                <span className="text-sm dark:text-secondary">
                  Unlock all features including AI and more
                </span>
              </div>

              <div className="w-full bg-vivid-gradient p-px rounded-full">
                <Button
                  className="w-full border-vivid bg-primary-10 hover:bg-transparent text-primary rounded-full font-bold "
                  variant={"default"}
                  size={"lg"}
                  onClick={handleUpgrading}
                >
                  {loading ? "Upgrading..." : "Upgrade"}
                </Button>
              </div>
            </div>
          )}

          <SignedIn>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserButton />

              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{prismaUser.name}</span>
                <span className="truncate text-xs">
                  {prismaUser.email}
                </span>
              </div>
              <ChevronDown className="ml-auto size-4" />
            </SidebarMenuButton>{" "}
          </SignedIn>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
