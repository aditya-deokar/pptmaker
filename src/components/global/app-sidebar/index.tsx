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
import { Project, User } from "@/generated/prisma";
import { data } from "@/lib/constants";


export function AppSidebar({
  recentProjects,
  user,
  ...props
}: { recentProjects: Project[] } & {user:User} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="bg-background-90"
    >
      <SidebarHeader className="pt-6 px-3 pb-0">
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
            <Avatar className="h-10 w-10 rounded-full">
              <AvatarImage src={"/vivid.png"} alt={`logo`} />
              <AvatarFallback className="rounded-lg">VI</AvatarFallback>
            </Avatar>
          </div>

          <span className="truncate text-primary text-3xl font-semibold">
            PPT Gen
          </span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent className="px-3 mt-10 gap-y-6">
        <NavMain items={data.navMain} />
        <RecentOpen recentProjects={recentProjects} />
      </SidebarContent>
      <SidebarFooter>
        <NavFooter prismaUser={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
