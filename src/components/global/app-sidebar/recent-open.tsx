"use client";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Project } from "@/generated/prisma";
import { useToast } from "@/hooks/use-toast";
import { JsonValue } from "@prisma/client/runtime/library";
import { useRouter } from "next/navigation";

export function RecentOpen({ recentProjects }: { recentProjects: Project[] }) {
  const router = useRouter();
  const { toast } = useToast();
  // const { setSlides } = useSlideStore();

  const handleClick = (projectId: string, slides: JsonValue) => {
    // console.log("Clicked");
    if (!projectId || !slides) {
      toast({
        title: "Project not found",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }
    // setSlides(JSON.parse(JSON.stringify(slides)));
    router.push(`/presentation/${projectId}`);
  };

  return (
    <SidebarGroup className="p-0 group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recently Opened</SidebarGroupLabel>
      <SidebarMenu>
        {recentProjects?.length > 0 ? (
          recentProjects.map((item, idx) => (
            <SidebarMenuItem key={idx}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={`hover:bg-primary-80`}
              >
                <Button
                  variant={"link"}
                  onClick={() => handleClick(item.id, item.slides)}
                  className={`text-xs items-center justify-start`}
                >
                  <span className="truncate line-clamp-1">{item.title}</span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        ) : (
          <></>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
