import { LayoutSlides, Slide } from '@/lib/types'
import { useDrag, useDrop } from 'react-dnd'
import { cn } from '@/lib/utils'
import { useSlideStore } from '@/store/useSlideStore'
import React, { useRef, useEffect } from 'react'
import { getEmptyImage } from 'react-dnd-html5-backend'
import ThumbnailPreview from './ThumbnailPreview'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from 'framer-motion'


type Props = {
    slide: Slide
    index: number
    moveSlide: (dragIndex: number, hoverIndex: number) => void
    onInsert?: (layout: LayoutSlides, index: number) => void
}

const SlideThumbnail = ({ index, moveSlide, slide, onInsert }: Props) => {
    const { currentSlide, setCurrentSlide, removeSlide } = useSlideStore()
    const ref = useRef<HTMLDivElement>(null)

    const [{ isDragging }, drag, preview] = useDrag({
        type: 'SLIDE',
        item: { index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    })

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true })
    }, [preview])

    const [{ isOver, canDrop, itemType }, drop] = useDrop({
        accept: ['SLIDE', 'layout'],
        hover(item: any, monitor: any) {
            if (!ref.current) {
                return
            }
            if (monitor.getItemType() === 'layout') {
                return
            }
            const dragIndex = item.index
            const hoverIndex = index
            if (dragIndex === hoverIndex) {
                return
            }

            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect()
            
            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
            
            // Determine mouse position
            const clientOffset = monitor.getClientOffset()
            if (!clientOffset) return
            
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top
            
            // Only perform the move when the mouse has crossed half of the items height
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return

            moveSlide(dragIndex, hoverIndex)
            item.index = hoverIndex
        },
        drop(item: any, monitor) {
            if (monitor.getItemType() === 'layout' && onInsert && item.component) {
                // Insert after the current slide
                onInsert(item.component, index + 1)
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
            itemType: monitor.getItemType(),
        }),
    })

    drag(drop(ref))

    const handleThumbnailClick = () => {
        setCurrentSlide(index);
        // Dispatch custom event to scroll the main editor to this slide
        window.dispatchEvent(new CustomEvent('editor:scroll-to-slide', { detail: { index } }));
    };

    return (
        <motion.div 
            ref={ref as any} 
            layoutId={slide.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full py-1"
        >
            {/* Slide Card */}
            <div
                className={cn(
                    'group relative flex flex-col gap-2 p-3 rounded-xl transition-all duration-300 overflow-visible cursor-pointer',
                    isDragging ? 'opacity-40 scale-95 ring-2 ring-primary/50 grayscale-[0.5]' : 'opacity-100',
                    index === currentSlide 
                        ? 'bg-muted border border-border ' 
                        : 'hover:bg-muted/50 border border-transparent hover:border-border/50',
                )}
                onClick={handleThumbnailClick}
            >
                <div className="flex items-center justify-between w-full relative z-10">
                    <span className={cn(
                        "text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border shadow-sm transition-colors",
                        index === currentSlide
                            ? "bg-primary text-primary-foreground border-primary"
                            : "text-muted-foreground bg-background border-border"
                    )}>
                        {index + 1}
                    </span>

                    {/* Options Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-7 w-7 transition-all rounded-full bg-background/50 backdrop-blur-sm border shadow-sm hover:bg-muted",
                                    index === currentSlide ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="w-4 h-4 text-foreground/70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg font-medium"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeSlide(slide.id)
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Slide
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className={cn(
                    "relative cursor-grab active:cursor-grabbing rounded-lg overflow-hidden transition-all duration-300 ring-2 ring-transparent",
                    index === currentSlide ? "ring-primary shadow-lg shadow-primary/20 scale-[1.02]" : "group-hover:scale-[1.01]"
                )}>
                    <ThumbnailPreview
                        slide={slide}
                        isActive={index === currentSlide}
                        index={index}
                    />
                </div>
            </div>

            {/* Drop Zone - Expands to create gap */}
            <AnimatePresence>
                {canDrop && itemType === 'layout' && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: isOver ? 64 : 12, opacity: isOver ? 1 : 0.5 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="w-full mt-1 overflow-hidden"
                    >
                        <div className={cn(
                            "w-full h-full rounded-lg border-2 border-dashed flex items-center justify-center backdrop-blur-sm transition-colors duration-300",
                            isOver
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-muted-foreground/30 bg-muted/20 text-muted-foreground"
                        )}>
                            <AnimatePresence>
                                {isOver && (
                                    <motion.span 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="text-xs font-medium flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3" /> Insert Layout
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default SlideThumbnail
