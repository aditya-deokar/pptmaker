"use client";
import React, { useState } from "react";
import { useSlideStore } from "@/store/useSlideStore";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, Palette, Type, X, ChevronRight } from "lucide-react";
import LayoutChooser from "./tabs/LayoutChooser";
import ThemeChooser from "./tabs/ThemeChooser";
import TextTypography from "./tabs/TextTypography";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

type TabType = 'layout' | 'typography' | 'theme' | null;

const EditorSidebar = () => {
    const [activeTab, setActiveTab] = useState<TabType>('layout');

    return (
        <div className="w-full h-full flex flex-col bg-background/50 backdrop-blur-xl border-l border-border/50 relative">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between p-3 pr-14 border-b border-border/50 bg-background/50 backdrop-blur-md z-10 sticky top-0 shrink-0">
                <div className="flex w-full items-center gap-1 bg-muted/40 p-1 rounded-xl">
                    {(['layout', 'typography', 'theme'] as TabType[]).map((tab) => {
                        const Icon = tab === 'layout' ? LayoutTemplate : tab === 'typography' ? Type : Palette;
                        const label = tab === 'layout' ? 'Layouts' : tab === 'typography' ? 'Text' : 'Themes';
                        const isActive = activeTab === tab;

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "relative flex-1 flex items-center justify-center gap-2 px-2 py-2 text-sm font-medium transition-colors duration-300 rounded-lg outline-none",
                                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-right-tab"
                                        className="absolute inset-0 bg-background shadow-sm border border-border/50 rounded-lg"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "opacity-70")} />
                                    <span className="hidden xl:inline">{label}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative p-4">
                <div className="h-full w-full overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-transparent">
                    {activeTab === 'layout' && <LayoutChooser />}
                    {activeTab === 'typography' && <TextTypography />}
                    {activeTab === 'theme' && <ThemeChooser />}
                </div>
            </div>
        </div>
    );
};

export default EditorSidebar;
