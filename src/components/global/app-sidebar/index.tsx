"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { RecentOpen } from "./recent-open";
import { NavMain } from "./nav-main";
import { NavFooter } from "./nav-footer";
import { Project } from "@/generated/prisma";
import { data } from "@/lib/constants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AuthenticatedAppUser } from "@/lib/user-compat";

export function AppSidebar({
  recentProjects,
  user,
  className,
  ...props
}: { recentProjects: Project[] } & { user: AuthenticatedAppUser } & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className={cn("bg-background-90", className)}
      {...props}
    >
      <SidebarHeader className="pt-6 px-3 pb-0 gap-4">
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent group"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground transition-transform duration-700 group-hover:rotate-[360deg]">
            <Avatar className="h-10 w-10 rounded-full">
              <AvatarImage src={"/logoipsum-246.png"} alt={`Verto AI logo`} />
              <AvatarFallback className="rounded-lg">Verto AI</AvatarFallback>
            </Avatar>
          </div>

          <span className="truncate text-vivid text-3xl font-semibold">
            <Link href={'/'}>Verto AI</Link>
          </span>
        </SidebarMenuButton>
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent className="px-3 mt-4 gap-y-6">
        <RecentOpen recentProjects={recentProjects} />
      </SidebarContent>
      <SidebarFooter>
        <NavFooter prismaUser={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
