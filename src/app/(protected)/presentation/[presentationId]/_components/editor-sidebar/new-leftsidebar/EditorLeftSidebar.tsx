'use client'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useSlideStore } from '@/store/useSlideStore'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { ContentItem, LayoutSlides, Slide } from '@/lib/types'
import { useDrag, useDrop } from 'react-dnd'
import SlideThumbnail from './SlideThumbnail'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from '@/components/ui/separator'
import { AnimatePresence } from 'framer-motion'
import { CustomDragLayer } from './CustomDragLayer'

type Props = {}

const EditorLeftSidebar = (props: Props) => {
    const { reorderSlides, addSlide, addSlideAtIndex } = useSlideStore();
    const slides = useSlideStore(state => state.slides);
    const [loading, setLoading] = useState(true);
    const orderedSlides = [...(slides || [])].sort((a, b) => (a.slideOrder ?? 0) - (b.slideOrder ?? 0));

    const moveSlide = (dragIndex: number, hoverIndex: number) => {
        reorderSlides(dragIndex, hoverIndex);
    }

    // insert slide logic
    const handleInsertSlide = (layoutComponent: LayoutSlides, index: number) => {
        const newSlide: Slide = {
            id: uuidv4(),
            slideName: `Slide ${orderedSlides.length + 1}`,
            type: 'slide',
            content: recursiveIdUpdate(layoutComponent.content),
            slideOrder: index,
        }
        addSlideAtIndex(newSlide, index)
    }

    const recursiveIdUpdate = (content: ContentItem): ContentItem => {
        const newId = uuidv4();

        if (Array.isArray(content.content)) {
            const isStringArray = content.content.length > 0 && typeof content.content[0] === 'string';
            const isStringArrayArray = content.content.length > 0 && Array.isArray(content.content[0]) && typeof (content.content[0] as any)[0] === 'string';

            if (isStringArray || isStringArrayArray) {
                return {
                    ...content,
                    id: newId
                };
            }

            return {
                ...content,
                id: newId,
                content: (content.content as ContentItem[]).map(recursiveIdUpdate)
            }
        }

        return {
            ...content,
            id: newId
        }
    }

    const handleAddSlide = (layoutComponent?: LayoutSlides) => {
        const newSlide: Slide = {
            id: uuidv4(),
            slideName: `Slide ${orderedSlides.length + 1}`,
            type: 'slide',
            content: layoutComponent
                ? recursiveIdUpdate(layoutComponent.content)
                : {
                    id: uuidv4(),
                    type: 'column',
                    name: 'Column',
                    content: [],
                    columns: 1,
                },
            slideOrder: orderedSlides.length,
        }
        addSlide(newSlide)
    }

    // Drop Zone implementation
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ['layout'],
        drop: (item: { layoutType: string, component: LayoutSlides }) => {
            handleAddSlide(item.component);
            return undefined;
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }), [orderedSlides.length]);

    useEffect(() => {
        if (typeof window !== 'undefined') setLoading(false);
    }, [])

    return (
        <div className='w-full h-full flex flex-col bg-background/50 backdrop-blur-xl border-r border-border/50 relative'>
            <CustomDragLayer />
            {/* Header */}
            <div className="px-5 py-4 pr-14 flex items-center justify-between shrink-0 border-b border-border/50 bg-background/50 backdrop-blur-md z-10 sticky top-0">
                <span className='text-sm font-semibold tracking-tight'>Slides</span>
                <div className="flex items-center gap-1">
                    <span className='text-xs font-medium px-2 py-1 bg-muted rounded-full text-muted-foreground'>{orderedSlides.length} slides</span>
                </div>
            </div>

            {/* Content */}
            <ScrollArea className='flex-1 w-full'>
                {loading ? (
                    <div className='w-full px-4 flex flex-col space-y-4 py-6'>
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className='h-28 w-full rounded-xl' />
                        ))}
                    </div>
                ) : (
                    <div className='p-4 space-y-3 pb-24'>
                        <AnimatePresence initial={false}>
                            {orderedSlides?.map((slide, index) => (
                                <SlideThumbnail
                                    key={slide.id || index}
                                    slide={slide}
                                    index={index}
                                    moveSlide={moveSlide}
                                    onInsert={handleInsertSlide}
                                />
                            ))}
                        </AnimatePresence>

                        {/* Add Slide Button / Drop Zone */}
                        <div
                            ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
                            className={cn(
                                "pt-4 pb-8 flex justify-center transition-all duration-300 relative",
                                isOver && canDrop ? "scale-105" : ""
                            )}
                        >
                            <Button
                                onClick={() => handleAddSlide()}
                                className={cn(
                                    "w-full py-6 rounded-xl border-dashed border-2 shadow-sm transition-all duration-300 font-medium",
                                    isOver && canDrop
                                        ? "border-primary bg-primary/10 text-primary scale-105 shadow-primary/20"
                                        : "border-border/60 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground bg-muted/20"
                                )}
                                variant="outline"
                            >
                                <Plus className={cn("w-5 h-5 mr-2 transition-transform duration-300", isOver && canDrop && "rotate-90")} />
                                {isOver && canDrop ? "Drop Layout Here" : "Add New Slide"}
                            </Button>
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}

export default EditorLeftSidebar
