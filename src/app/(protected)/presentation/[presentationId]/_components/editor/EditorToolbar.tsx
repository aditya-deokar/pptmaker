'use client'

import React, { useState } from 'react'
import { useSlideStore } from '@/store/useSlideStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type,
    Palette,
    X,
    Undo2,
    Redo2,
    Save,
    Check
} from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ContentItem, Theme } from '@/lib/types'
import { updateSlides, updateTheme } from '@/actions/projects'
import { toast } from 'sonner'
import { themes } from '@/lib/constants'
import { useTheme } from 'next-themes'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

type Props = {
    isEditable?: boolean
}

const EditorToolbar = ({ isEditable = true }: Props) => {
    const {
        selectedComponentId,
        slides,
        currentSlide,
        updateComponent,
        setSelectedComponent,
        undo,
        redo,
        past,
        future,
        project,
        currentTheme,
        setCurrentTheme
    } = useSlideStore()

    const { setTheme } = useTheme()
    const [isSaving, setIsSaving] = useState(false)

    // Find the selected component
    const currentSlideData = (slides || [])[currentSlide]

    const findComponent = (content: ContentItem): ContentItem | null => {
        if (content.id === selectedComponentId) {
            return content
        }
        if (Array.isArray(content.content)) {
            for (const item of content.content as ContentItem[]) {
                const found = findComponent(item)
                if (found) return found
            }
        }
        return null
    }

    const selectedComponent = currentSlideData && selectedComponentId ? findComponent(currentSlideData.content) : null

    const handleUpdate = (updates: Partial<ContentItem>) => {
        if (currentSlideData && selectedComponentId) {
            updateComponent(currentSlideData.id, selectedComponentId, updates)
        }
    }

    const handleSave = async () => {
        if (isEditable && project) {
            setIsSaving(true)
            try {
                await updateSlides(project.id, JSON.parse(JSON.stringify(slides)))
                toast.success("Slides saved successfully")
            } catch (error) {
                toast.error("Failed to save slides")
                console.error("Save error:", error)
            } finally {
                setIsSaving(false)
            }
        }
    }

    const handleThemeChange = async (theme: Theme) => {
        if (!project) return

        setTheme(theme.type)
        setCurrentTheme(theme)
        try {
            const res = await updateTheme(project.id, theme.name)
            if (res.status !== 200) throw new Error("Failed to update theme")

            toast.success(`Theme changed to ${theme.name}`)
        } catch (error) {
            console.error(error)
            toast.error("Failed to update theme")
        }
    }

    const isTextComponent = selectedComponent && [
        'text', 'paragraph', 'heading1', 'heading2', 'heading3', 'heading4',
        'title', 'blockquote', 'numberedList', 'bulletList', 'todoList',
        'calloutBox', 'codeBlock'
    ].includes(selectedComponent.type)

    // Default values map
    const defaultStyles: Record<string, { fontSize: string, fontWeight: string }> = {
        heading1: { fontSize: '32px', fontWeight: '800' },
        heading2: { fontSize: '28px', fontWeight: '700' },
        heading3: { fontSize: '24px', fontWeight: '600' },
        heading4: { fontSize: '20px', fontWeight: '500' },
        title: { fontSize: '40px', fontWeight: '900' },
        paragraph: { fontSize: '16px', fontWeight: '400' },
    }

    const currentFontSize = selectedComponent ? (selectedComponent.fontSize || defaultStyles[selectedComponent.type]?.fontSize || '16px') : '16px'
    const currentFontWeight = selectedComponent ? (selectedComponent.fontWeight || defaultStyles[selectedComponent.type]?.fontWeight || 'normal') : 'normal'

    if (!isEditable) return null

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm border shadow-2xl rounded-full px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 z-[100] animate-in fade-in slide-in-from-bottom-4 max-w-[calc(100%-1rem)] sm:max-w-[90vw] overflow-x-auto scrollbar-none">

            {/* Undo/Redo/Save Section */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={undo}
                    disabled={past.length === 0}
                    className="h-8 w-8 rounded-full"
                    title="Undo"
                >
                    <Undo2 className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={redo}
                    disabled={future.length === 0}
                    className="h-8 w-8 rounded-full"
                    title="Redo"
                >
                    <Redo2 className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-8 w-8 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Save"
                >
                    <Save className="w-4 h-4" />
                </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Theme Selector */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full gap-2 text-xs font-medium">
                        <Palette className="w-4 h-4" />
                        Themes
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="center" side="top" sideOffset={10}>
                    <div className="p-3 border-b bg-muted/50">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Select Theme
                        </h4>
                    </div>
                    <ScrollArea className="h-80">
                        <div className="p-2 grid grid-cols-2 gap-2">
                            {themes.map((theme) => (
                                <button
                                    key={theme.name}
                                    onClick={() => handleThemeChange(theme)}
                                    className={cn(
                                        "relative flex flex-col items-start p-2 rounded-lg border transition-all hover:scale-[1.02]",
                                        currentTheme.name === theme.name ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                                    )}
                                    style={{ background: theme.gradientBackground || theme.backgroundColor }}
                                >
                                    <div className="flex items-center justify-between w-full mb-2">
                                        <span
                                            className="text-[10px] font-bold truncate max-w-[80%]"
                                            style={{ color: theme.fontColor }}
                                        >
                                            {theme.name}
                                        </span>
                                        {currentTheme.name === theme.name && (
                                            <div className="bg-white rounded-full p-0.5 shadow-sm">
                                                <Check className="w-3 h-3 text-green-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 rounded-full ring-1 ring-white/20" style={{ backgroundColor: theme.fontColor }} />
                                        <div className="w-3 h-3 rounded-full ring-1 ring-white/20" style={{ backgroundColor: theme.accentColor }} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>

            {/* Text Formatting Tools */}
            {selectedComponent && isTextComponent && (
                <>
                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Font Size */}
                    <div className="flex items-center gap-1 border-r pr-2">
                        <Type className="w-4 h-4 text-muted-foreground" />
                        <Input
                            type="number"
                            className="w-14 h-8 text-xs px-1 text-center"
                            value={parseInt(currentFontSize) || 16}
                            onChange={(e) => handleUpdate({ fontSize: `${e.target.value}px` })}
                            placeholder="16"
                        />
                    </div>

                    {/* Bold */}
                    <Button
                        variant={currentFontWeight === 'bold' || currentFontWeight === '700' || currentFontWeight === '800' || currentFontWeight === '900' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleUpdate({ fontWeight: currentFontWeight === 'bold' ? 'normal' : 'bold' })}
                    >
                        <Bold className="w-4 h-4" />
                    </Button>

                    {/* Italic */}
                    <Button
                        variant={selectedComponent.fontStyle === 'italic' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleUpdate({ fontStyle: selectedComponent?.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    >
                        <Italic className="w-4 h-4" />
                    </Button>

                    {/* Underline */}
                    <Button
                        variant={selectedComponent.textDecoration === 'underline' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleUpdate({ textDecoration: selectedComponent?.textDecoration === 'underline' ? 'none' : 'underline' })}
                    >
                        <Underline className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Alignment */}
                    <div className="flex items-center bg-muted/50 rounded-full p-0.5">
                        <Button
                            variant={selectedComponent.textAlign === 'left' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleUpdate({ textAlign: 'left' })}
                        >
                            <AlignLeft className="w-3 h-3" />
                        </Button>
                        <Button
                            variant={selectedComponent.textAlign === 'center' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleUpdate({ textAlign: 'center' })}
                        >
                            <AlignCenter className="w-3 h-3" />
                        </Button>
                        <Button
                            variant={selectedComponent.textAlign === 'right' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleUpdate({ textAlign: 'right' })}
                        >
                            <AlignRight className="w-3 h-3" />
                        </Button>
                    </div>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Color Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <Palette className="w-4 h-4" style={{ color: selectedComponent.color }} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" side="top">
                            <div className="grid grid-cols-5 gap-1">
                                {['#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'].map((color) => (
                                    <button
                                        key={color}
                                        className="w-8 h-8 rounded-full border shadow-sm hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        onClick={() => handleUpdate({ color })}
                                    />
                                ))}
                            </div>
                            <Input
                                type="color"
                                className="w-full h-8 mt-2 cursor-pointer"
                                value={selectedComponent.color || '#000000'}
                                onChange={(e) => handleUpdate({ color: e.target.value })}
                            />
                        </PopoverContent>
                    </Popover>
                </>
            )}

            {/* Close Selection (Only if something is selected) */}
            {selectedComponent && (
                <>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                        onClick={() => setSelectedComponent(null)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </>
            )}

        </div>
    )
}

export default EditorToolbar
