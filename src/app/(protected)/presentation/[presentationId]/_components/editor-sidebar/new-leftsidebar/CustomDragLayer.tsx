'use client'
import { useDragLayer } from 'react-dnd'
import { useSlideStore } from '@/store/useSlideStore'
import ThumbnailPreview from './ThumbnailPreview'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function CustomDragLayer() {
    const { isDragging, item, currentOffset, itemType } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }))

    const slides = useSlideStore(state => state.slides)
    
    if (!isDragging || itemType !== 'SLIDE' || !currentOffset) {
        return null
    }

    const orderedSlides = [...(slides || [])].sort((a, b) => (a.slideOrder ?? 0) - (b.slideOrder ?? 0))
    const slide = orderedSlides[item.index]

    if (!slide) return null;

    return (
        <div style={{
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 99999,
            left: 0,
            top: 0,
            transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
            width: '200px', // Matches the approximate width of the sidebar thumbnails
        }}>
           <motion.div 
                initial={{ scale: 0.95, opacity: 0, rotate: 0 }}
                animate={{ scale: 1.05, opacity: 1, rotate: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-background rounded-lg border border-primary/50 overflow-hidden shadow-2xl"
            >
                <ThumbnailPreview slide={slide} isActive={true} index={item.index} />
           </motion.div>
        </div>
    )
}
