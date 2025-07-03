"use client";

import { ChevronDown } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/generated/prisma";
import { useToast } from "@/hooks/use-toast";
import { buySubscription } from "@/actions/payment";

export function NavFooter({ prismaUser }: { prismaUser: User }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  if (!isLoaded || !isSignedIn) {
    return null;
  }

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
        <div className="flex flex-col gap-y-6 items-start group-data-[collapsible=icon]:hidden">
          {/* Get Creative Ai card */}
          {!prismaUser.subscription && (
            <div className="flex flex-col items-start p-2 pb-3 gap-4 bg-background-80">
              <div className="flex flex-col items-start gap-1">
                <p className="text-base font-bold">
                  Get <span className="text-vivid">Creative AI</span>
                </p>
                <span className="text-sm dark:text-secondary">
                  Unlock all features including AI and more
                </span>
              </div>

              <div className="w-full bg-vivid-gradient p-[1px] rounded-full">
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
                <span className="truncate font-semibold">{user?.fullName}</span>
                <span className="truncate text-xs">
                  {user?.emailAddresses[0]?.emailAddress}
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
