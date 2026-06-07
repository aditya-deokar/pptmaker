"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slide, Theme } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Settings2,
  X,
  Play,
  ScrollText,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { resolveThemeTokens } from "@/lib/themeUtils";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MasterRecursiveComponent } from "@/app/(protected)/presentation/[presentationId]/_components/editor/MasterRecursiveComponent";

type TransitionType = "slide" | "fade" | "scale" | "stack";
type PresentationMode = "slide" | "scroll";

type PresentationViewerProps = {
  title: string;
  slides: Slide[];
  theme: Theme;
  exitHref: string;
  exitLabel?: string;
  viewerMode?: "owner" | "share";
};

const transitions: Record<TransitionType, any> = {
  slide: {
    variants: {
      hidden: { x: 50, opacity: 0 },
      visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
      exit: { x: -50, opacity: 0, transition: { duration: 0.5, ease: "easeIn" } },
    },
    initial: "hidden",
    animate: "visible",
    exit: "exit",
  },
  fade: {
    variants: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.6 } },
      exit: { opacity: 0, transition: { duration: 0.6 } },
    },
    initial: "hidden",
    animate: "visible",
    exit: "exit",
  },
  scale: {
    variants: {
      hidden: { scale: 0.8, opacity: 0 },
      visible: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
      exit: { scale: 1.1, opacity: 0, transition: { duration: 0.5 } },
    },
    initial: "hidden",
    animate: "visible",
    exit: "exit",
  },
  stack: {
    variants: {
      hidden: { y: 100, opacity: 0, scale: 0.9 },
      visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, type: "spring", bounce: 0.2 } },
      exit: { y: -50, opacity: 0, scale: 0.95, transition: { duration: 0.4 } },
    },
    initial: "hidden",
    animate: "visible",
    exit: "exit",
  },
};

function SlideCanvas({
  slide,
  currentTheme,
  scale = 1,
  isMobile = false,
  isScrollMode = false,
}: {
  slide: Slide;
  currentTheme: Theme;
  scale?: number;
  isMobile?: boolean;
  isScrollMode?: boolean;
}) {
  const baseWidth = 960;
  const baseHeight = 540;

  const tokens = resolveThemeTokens(currentTheme);

  if (isScrollMode && !isMobile) {
    return (
      <div
        style={{
          backgroundColor: currentTheme.slideBackgroundColor || currentTheme.backgroundColor,
          backgroundImage: currentTheme.gradientBackground,
          color: currentTheme.fontColor,
          fontFamily: tokens.headingFontFamily,
          borderRadius: tokens.borderRadius,
        }}
        className="relative w-full max-w-[1000px] w-[90vw] mx-auto min-h-[560px] flex flex-col rounded-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.3)] transition-all duration-300 border border-white/5"
      >
        <div className="flex-1 w-full p-10 md:p-14 pointer-events-none select-none">
          <MasterRecursiveComponent
            content={slide.content}
            onContentChange={() => {}}
            isPreview={true}
            isEditable={false}
            slideId={slide.id}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: isMobile ? "100%" : baseWidth,
        height: isMobile ? "auto" : baseHeight,
        minHeight: isMobile ? "100vh" : baseHeight,
        transform: isMobile ? "none" : `scale(${scale})`,
        backgroundColor:
          currentTheme.slideBackgroundColor || currentTheme.backgroundColor,
        backgroundImage: currentTheme.gradientBackground,
        color: currentTheme.fontColor,
        fontFamily: tokens.headingFontFamily,
        borderRadius: tokens.borderRadius,
      }}
      className={cn(
        "relative origin-center overflow-hidden shadow-2xl transition-all duration-300",
        isMobile ? "rounded-none overflow-y-auto" : "rounded-xl"
      )}
    >
      <div
        className={cn(
          "h-full w-full pointer-events-none select-none",
          isMobile ? "p-4" : "p-8"
        )}
      >
        <MasterRecursiveComponent
          content={slide.content}
          onContentChange={() => {}}
          isPreview={true}
          isEditable={false}
          slideId={slide.id}
        />
      </div>
    </div>
  );
}

function ScrollSlide({
  slide,
  index,
  currentTheme,
  scale,
  isMobile,
  onInView,
}: {
  slide: Slide;
  index: number;
  currentTheme: Theme;
  scale: number;
  isMobile: boolean;
  onInView: (index: number) => void;
}) {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.div
      id={`scroll-slide-${index}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      onViewportEnter={() => onInView(index)}
      className="snap-center py-12 flex items-center justify-center min-h-[70vh]"
    >
      <SlideCanvas
        slide={slide}
        currentTheme={currentTheme}
        scale={isMobile ? 1 : scale * 0.9}
        isMobile={isMobile}
        isScrollMode={true}
      />
    </motion.div>
  );
}

export default function PresentationViewer({
  title,
  slides,
  theme,
  exitHref,
  exitLabel = "Exit",
  viewerMode = "owner",
}: PresentationViewerProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeSlides = useMemo(() => slides ?? [], [slides]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGridView, setIsGridView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [transitionType, setTransitionType] =
    useState<TransitionType>("slide");
  const [presentationMode, setPresentationMode] =
    useState<PresentationMode>("scroll");
  const [mouseIdle, setMouseIdle] = useState(false);

  const currentSlideData = safeSlides[currentSlide];

  useEffect(() => {
    setTheme(theme.type === "dark" ? "dark" : "light");
  }, [setTheme, theme.type]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [safeSlides]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobileBreakpoint = 768;

      setIsMobile(width < mobileBreakpoint);

      if (width >= mobileBreakpoint) {
        const padding = 64;
        const availableWidth = width - padding;
        const availableHeight = window.innerHeight - padding;
        const baseWidth = 960;
        const baseHeight = 540;
        const scaleX = availableWidth / baseWidth;
        const scaleY = availableHeight / baseHeight;

        setScale(Math.min(scaleX, scaleY));
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNext = useCallback(() => {
    if (presentationMode === "scroll" && scrollContainerRef.current) {
      const nextSlide = Math.min(currentSlide + 1, safeSlides.length - 1);
      const targetElement = document.getElementById(`scroll-slide-${nextSlide}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setCurrentSlide((previous) =>
      Math.min(previous + 1, Math.max(safeSlides.length - 1, 0))
    );
  }, [safeSlides.length, presentationMode, currentSlide]);

  const handlePrev = useCallback(() => {
    if (presentationMode === "scroll" && scrollContainerRef.current) {
      const prevSlide = Math.max(currentSlide - 1, 0);
      const targetElement = document.getElementById(`scroll-slide-${prevSlide}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setCurrentSlide((previous) => Math.max(previous - 1, 0));
  }, [presentationMode, currentSlide]);

  const handleExit = useCallback(() => {
    router.push(exitHref);
  }, [exitHref, router]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void containerRef.current?.requestFullscreen();
      return;
    }

    void document.exitFullscreen();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGridView) {
        if (event.key === "Escape") {
          setIsGridView(false);
        }
        return;
      }

      if (
        event.key === "ArrowRight" ||
        event.key === " " ||
        event.key === "Enter"
      ) {
        handleNext();
      } else if (event.key === "ArrowLeft") {
        handlePrev();
      } else if (event.key === "Escape") {
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else {
          handleExit();
        }
      } else if (event.key.toLowerCase() === "g") {
        setIsGridView((previous) => !previous);
      } else if (event.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleExit, handleNext, handlePrev, isGridView, toggleFullscreen]);

  useEffect(() => {
    const handleMouseMove = () => {
      setMouseIdle(false);

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => setMouseIdle(true), 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    handleMouseMove();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  if (safeSlides.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101010] px-6 text-white">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-white/70">
            This presentation does not have any slides available yet.
          </p>
          <Button onClick={handleExit}>{exitLabel}</Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="relative h-screen w-full overflow-hidden bg-[#101010] text-white selection:bg-primary/30"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: mouseIdle && !isGridView ? 0 : 1,
            y: mouseIdle && !isGridView ? -20 : 0,
          }}
          className="absolute left-0 top-0 z-50 flex h-24 w-full items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-4"
        >
          <div
            className="absolute left-0 top-0 h-1 bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${((currentSlide + 1) / safeSlides.length) * 100}%`,
            }}
          />

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-white/70 hover:bg-white/10 hover:text-white"
              onClick={handleExit}
            >
              <X className="mr-2 h-5 w-5" />
              {exitLabel}
            </Button>

            {viewerMode === "share" ? (
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 backdrop-blur md:flex">
                <Globe className="h-3.5 w-3.5" />
                Public link
              </div>
            ) : null}
          </div>

          <div className="hidden max-w-[50vw] truncate rounded-full bg-black/30 px-4 py-2 text-sm text-white/85 backdrop-blur md:block">
            {title}
          </div>
        </motion.div>

        <div className="relative flex h-full w-full items-center justify-center">
          <AnimatePresence mode="wait">
            {!isGridView && presentationMode === "slide" && currentSlideData ? (
              <motion.div
                key={currentSlide}
                {...transitions[transitionType]}
                className="absolute inset-0 flex items-center justify-center"
              >
                <SlideCanvas
                  slide={currentSlideData}
                  currentTheme={theme}
                  scale={scale}
                  isMobile={isMobile}
                />
              </motion.div>
            ) : !isGridView && presentationMode === "scroll" ? (
              <motion.div
                key="scroll-mode"
                ref={scrollContainerRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full overflow-y-auto scroll-smooth snap-y snap-mandatory px-4 pb-32 pt-20"
              >
                <div className="mx-auto flex max-w-5xl flex-col">
                  {safeSlides.map((slide, index) => (
                    <ScrollSlide
                      key={slide.id}
                      slide={slide}
                      index={index}
                      currentTheme={theme}
                      scale={scale}
                      isMobile={isMobile}
                      onInView={setCurrentSlide}
                    />
                  ))}
                  <div className="flex h-64 flex-col items-center justify-center gap-4 text-white/30">
                    <div className="h-px w-24 bg-white/10" />
                    <p className="text-sm font-medium uppercase tracking-widest">End of Presentation</p>
                    <Button variant="outline" className="border-white/10 text-white/50 hover:bg-white/5 hover:text-white" onClick={handleExit}>
                      {exitLabel}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {isGridView ? (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                className="absolute inset-0 z-40 overflow-y-auto bg-black/60 p-12"
              >
                <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
                  {safeSlides.map((slide, index) => (
                    <motion.button
                      key={slide.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setCurrentSlide(index);
                        setIsGridView(false);
                      }}
                      className={cn(
                        "group relative aspect-video overflow-hidden rounded-xl ring-2 transition-all duration-300",
                        currentSlide === index
                          ? "scale-105 ring-primary shadow-2xl shadow-primary/20"
                          : "ring-transparent hover:scale-105 hover:ring-white/50"
                      )}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 origin-top-left"
                        style={{
                          transform: "scale(0.25)",
                          width: "400%",
                          height: "400%",
                        }}
                      >
                        <div
                          className="h-full w-full p-8"
                          style={{
                            backgroundColor:
                              theme.slideBackgroundColor || theme.backgroundColor,
                            backgroundImage: theme.gradientBackground,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                          }}
                        >
                          <MasterRecursiveComponent
                            content={slide.content}
                            onContentChange={() => {}}
                            isPreview={true}
                            isEditable={false}
                            slideId={slide.id}
                          />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-md">
                        {index + 1}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{
            y: mouseIdle && !isGridView ? 100 : 0,
            opacity: mouseIdle && !isGridView ? 0 : 1,
          }}
          className="absolute bottom-8 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 p-2 shadow-2xl backdrop-blur-xl transition-colors hover:bg-black/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  disabled={currentSlide === 0}
                  className="h-10 w-10 rounded-full text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous (Left Arrow)</TooltipContent>
            </Tooltip>

            <div className="flex min-w-[80px] items-center justify-center gap-1 px-4 font-mono text-sm font-medium text-white/90">
              <span className="text-primary">{currentSlide + 1}</span>
              <span className="text-white/30">/</span>
              <span>{safeSlides.length}</span>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={currentSlide === safeSlides.length - 1}
                  className="h-10 w-10 rounded-full text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next (Space/Right Arrow)</TooltipContent>
            </Tooltip>

            <div className="mx-2 h-6 w-px bg-white/10" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsGridView((previous) => !previous)}
                  className={cn(
                    "h-10 w-10 rounded-full text-white hover:bg-white/10",
                    isGridView && "bg-white/20 text-primary"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Grid View (G)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPresentationMode(presentationMode === "slide" ? "scroll" : "slide")}
                  className={cn(
                    "h-10 w-10 rounded-full text-white hover:bg-white/10",
                    presentationMode === "scroll" && "bg-white/20 text-primary"
                  )}
                >
                  {presentationMode === "slide" ? <ScrollText className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{presentationMode === "slide" ? "Scroll Mode" : "Slide Mode"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="h-10 w-10 rounded-full text-white hover:bg-white/10"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen (F)</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-white hover:bg-white/10"
                >
                  <Settings2 className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="border-white/10 bg-black/90 text-white backdrop-blur-xl"
                side="top"
              >
                <DropdownMenuLabel>Transition</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {(["slide", "fade", "scale", "stack"] as TransitionType[]).map(
                  (transition) => (
                    <DropdownMenuItem
                      key={transition}
                      onClick={() => setTransitionType(transition)}
                      className={cn(
                        "cursor-pointer capitalize",
                        transitionType === transition && "text-primary"
                      )}
                    >
                      {transition}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
