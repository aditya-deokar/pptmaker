"use client";
import React from "react";
import { useSlideStore } from "@/store/useSlideStore";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, Palette, Type } from "lucide-react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import LayoutChooser from "./tabs/LayoutChooser";
import { component } from "@/lib/constants";
import ComponentCard from "./tabs/components-tab/ComponentPreview";
import ThemeChooser from "./tabs/ThemeChooser";


type Props = {};

const EditorSidebar = (props: Props) => {
    const { currentTheme } = useSlideStore();

    return (
        <div className="fixed top-1/2 right-0 transform -translate-y-1/2 z-10 hover:shadow-xl">
            <div className="rounded-xl border-r-0 border border-background-70 shadow-lg p-2 flex flex-col items-center space-y-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full hover:scale-110 transition-all"
                        >
                            <LayoutTemplate className="h-5 w-5" />
                            <span className="sr-only">Choose Layout</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="left" align="center" className="w-[480px] p-0">
                        <LayoutChooser />
                    </PopoverContent>
                </Popover>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full hover:scale-110 transition-all"
                        >
                            <Type className="h-5 w-5" />
                            <span className="sr-only">Choose Layout</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        side="left"
                        align="center"
                        className="w-[480px] p-0"
                        style={{
                            backgroundColor: currentTheme.backgroundColor,
                            color: currentTheme.fontColor,
                        }}
                    >
                        {/* <ScrollArea className="h-[400px]">
                            <div className="p-4 flex flex-col space-y-6">
                                {component.map((group, idx) => (
                                    <div className="space-y-2" key={idx}>
                                        <h3 className="text-sm font-medium text-muted-foreground px-1">
                                            {group.name}
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {group.components.map((item) => (
                                                <ComponentCard key={item.componentType} item={item} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea> */}
                    </PopoverContent>
                </Popover>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full hover:scale-110 transition-all"
                        >
                            <Palette className="h-5 w-5" />
                            <span className="sr-only">Change Style</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="left" align="center" className="w-80">
                        <ThemeChooser />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};

export default EditorSidebar;
