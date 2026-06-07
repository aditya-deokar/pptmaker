"use client";

import { useSlideStore } from "@/store/useSlideStore";
import React, { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { resolveThemeTokens } from "@/lib/themeUtils";
import { ContentItem, LayoutSlides, Slide } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { EllipsisVertical, Trash, Plus } from "lucide-react";
import { MasterRecursiveComponent } from "./MasterRecursiveComponent";
import EditorToolbar from "./EditorToolbar";
import { useDrop } from "react-dnd";
import { motion, AnimatePresence } from "framer-motion";

interface SlideCardProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  handleDelete: (id: string) => void;
  isEditable: boolean;
}

// Helper to recursively assign new IDs to a component structure
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

const SlideCard = forwardRef<HTMLDivElement, SlideCardProps>(({
  slide,
  index,
  isActive,
  handleDelete,
  isEditable,
}, ref) => {
  const { currentTheme, updateContentItem, setSelectedComponent, updateSlide } = useSlideStore();

  const handleContentChange = (
    contentId: string,
    newContent: string | string[] | string[][]
  ) => {
    if (isEditable) {
      updateContentItem(slide.id, contentId, newContent);
    }
  };

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'layout',
    drop: (item: { layoutType: string, component: LayoutSlides }) => {
      if (!isEditable) return;

      // Clone and update IDs to avoid collisions
      const newContent = recursiveIdUpdate(item.component.content);
      updateSlide(slide.id, newContent);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [slide.id, isEditable]);

  const tokens = resolveThemeTokens(currentTheme);

  // Combine refs for both IntersectionObserver and react-dnd drop target
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      // Forward ref to parent (IntersectionObserver)
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
      // Apply drop target ref
      drop(node);
    },
    [ref, drop]
  );

  return (
    <div
      ref={setRefs}
      className={cn(
        "relative w-full max-w-[900px] min-h-[500px] mx-auto flex flex-col rounded-2xl transition-all duration-300",
        "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)]",
        isActive ? "ring-2 ring-primary/50 shadow-[0_8px_40px_-8px_rgba(var(--primary),0.15)]" : "",
        isOver && canDrop ? "ring-4 ring-primary/50 scale-[1.01]" : ""
      )}
      style={{
        backgroundImage: currentTheme.gradientBackground,
        backgroundColor: currentTheme.slideBackgroundColor || currentTheme.backgroundColor,
        color: currentTheme.fontColor,
        fontFamily: tokens.headingFontFamily,
        borderRadius: tokens.borderRadius,
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent(null);
      }}
    >
      {/* Card Number Badge */}
      <div className="absolute -top-3 -left-3 z-10 flex items-center justify-center">
        <div className="bg-background text-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md border border-border/50">
          {index + 1}
        </div>
      </div>

      <div className="flex-1 w-full p-8 sm:p-10 md:p-12 @container">
        <MasterRecursiveComponent
          content={slide.content}
          isPreview={false}
          slideId={slide.id}
          isEditable={isEditable}
          onContentChange={handleContentChange}
        />
      </div>

      {isEditable && (
        <Popover>
          <PopoverTrigger asChild className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-50">
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full shadow-md backdrop-blur-md bg-white/20 hover:bg-white/40 border-none">
              <EllipsisVertical className="w-4 h-4 text-black dark:text-white" />
              <span className="sr-only">Slide options</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-fit p-1 border-white/10 bg-black/80 backdrop-blur-xl text-white" align="end">
            <div className="flex flex-col">
              <Button variant="ghost" size="sm" className="justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleDelete(slide.id)}>
                <Trash className="w-4 h-4 mr-2" />
                Delete slide
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
});
SlideCard.displayName = "SlideCard";

type Props = {
  isEditable: boolean;
};

const Editor = ({ isEditable }: Props) => {
  const {
    currentSlide,
    setCurrentSlide,
    removeSlide,
    addSlide,
    slides,
  } = useSlideStore();

  const orderedSlides = [...slides].sort((a, b) => (a.slideOrder ?? 0) - (b.slideOrder ?? 0));
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") setLoading(false);
  }, []);

  // Intersection Observer to track active slide during scroll
  useEffect(() => {
    const observerOptions = {
      root: containerRef.current,
      rootMargin: "-20% 0px -60% 0px", // Trigger when slide is in the upper middle area
      threshold: 0,
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = slideRefs.current.findIndex((el) => el === entry.target);
          if (index !== -1 && index !== currentSlide) {
            setCurrentSlide(index);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    slideRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [currentSlide, setCurrentSlide, orderedSlides.length]);

  const handleDelete = (id: string) => {
    if (isEditable) {
      removeSlide(id);
    }
  };

  const handleAddSlide = (index: number) => {
    const newSlide: Slide = {
      id: uuidv4(),
      slideName: `Slide ${orderedSlides.length + 1}`,
      type: 'slide',
      content: {
        id: uuidv4(),
        type: 'column',
        name: 'Column',
        content: [],
        columns: 1,
      },
      slideOrder: index + 1,
    };
    
    // Add slide via store
    useSlideStore.getState().addSlideAtIndex(newSlide, index + 1);
    
    // Scroll to new slide after a brief delay for rendering
    setTimeout(() => {
      slideRefs.current[index + 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Expose a way for sidebar to trigger scroll to slide
  useEffect(() => {
    const handleScrollToSlide = (e: CustomEvent<{ index: number }>) => {
      const index = e.detail.index;
      if (slideRefs.current[index]) {
        slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    window.addEventListener('editor:scroll-to-slide', handleScrollToSlide as EventListener);
    return () => window.removeEventListener('editor:scroll-to-slide', handleScrollToSlide as EventListener);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden bg-muted/20">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      
      {loading ? (
        <div className="w-full h-full flex flex-col items-center justify-start p-12 gap-12 overflow-hidden">
          <Skeleton className="h-[400px] w-full max-w-[900px] rounded-2xl" />
          <Skeleton className="h-[400px] w-full max-w-[900px] rounded-2xl" />
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth px-4 sm:px-8 custom-scrollbar"
          style={{ scrollSnapType: 'y proximity', scrollPaddingTop: '2rem' }}
        >
          <div className="py-12 flex flex-col items-center gap-6 pb-48 max-w-[1000px] mx-auto">
            {orderedSlides.length === 0 ? (
               <div className="w-full max-w-[900px] h-[400px] flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm border-2 border-dashed border-border rounded-2xl p-8 sm:p-12 text-center gap-4 sm:gap-6 mt-12 shadow-sm">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-primary/60" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Start your presentation</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">Drag and drop layouts from the right sidebar, or click the + button to add a blank slide.</p>
                  </div>
                  <Button onClick={() => handleAddSlide(-1)} className="mt-4">
                    Add Blank Slide
                  </Button>
               </div>
            ) : (
              orderedSlides.map((slide, index) => (
                <div 
                  key={slide.id} 
                  className="w-full group/card-wrapper flex flex-col items-center"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <SlideCard
                    ref={(el) => { slideRefs.current[index] = el; }}
                    slide={slide}
                    index={index}
                    isActive={currentSlide === index}
                    handleDelete={handleDelete}
                    isEditable={isEditable}
                  />
                  
                  {/* Subtle Add Slide Button between cards */}
                  {isEditable && (
                    <div className="w-full max-w-[900px] h-8 flex items-center justify-center opacity-0 group-hover/card-wrapper:opacity-100 transition-opacity my-4">
                      <div className="w-full h-px bg-border/40 relative flex items-center justify-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="absolute bg-background/80 backdrop-blur-sm border-border/50 text-muted-foreground hover:text-primary hover:border-primary shadow-sm h-7 rounded-full px-3"
                          onClick={() => handleAddSlide(index)}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          <span className="text-xs font-medium">Add slide</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <EditorToolbar isEditable={isEditable} />
    </div>
  );
};

export default Editor;
