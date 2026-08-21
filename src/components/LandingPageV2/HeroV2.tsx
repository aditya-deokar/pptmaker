
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import FloatingLines from './FloatingLines';
import { useTheme } from "next-themes";

export default function HeroV2() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Default to dark mode colors if not mounted yet
    const currentTheme = mounted ? (resolvedTheme || theme) : 'dark';

    const linesColors = currentTheme === 'dark'
        ? ["#F55C7A", "#FF7193", "#F6BC66"]
        : ["#F55C7A", "#F6BC66", "#8B5CF6"]; // Light mode: vibrant brand colors

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const opacity = 1;
    const y = 0;

    // 3D Scroll Effect for Mockup
    const mockupRotateX = useTransform(scrollYProgress, [0, 1], [0, 25]);
    const mockupScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
    const mockupOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.5]);
    const mockupY = useTransform(scrollYProgress, [0, 1], [0, -100]);


    return (
        <section ref={containerRef} className="relative min-h-[100vh] flex flex-col justify-center pt-32 pb-20 md:pt-48 bg-white dark:bg-[#050505] overflow-hidden transition-colors duration-500">

            {/* Floating Lines Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30">
                <FloatingLines
                    enabledWaves={["top", "middle", "bottom"]}
                    lineCount={5}
                    lineDistance={10}
                    bendRadius={6}
                    bendStrength={-1.5}
                    interactive
                    parallax={true}
                    animationSpeed={0.4}
                    linesGradient={linesColors}
                    mixBlendMode={currentTheme === 'dark' ? 'screen' : 'multiply'}
                />
            </div>

            {/* Background Glow */}
            {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#F55C7A] opacity-[0.08] dark:opacity-[0.15] blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#F6BC66] opacity-[0.08] dark:opacity-[0.15] blur-[150px] rounded-full" />
            </div> */}

            {/* Content Container - Aligned with Menu Overlay */}
            <div className="relative z-10 w-full px-6 md:pl-[120px] md:pr-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">

                    {/* Hero Text Area - Occupies first 3 columns */}
                    <motion.div
                        style={{ opacity }}
                        className="col-span-1 md:col-span-3 flex flex-col justify-end"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 w-fit"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-[#F55C7A] animate-pulse"></span>
                            <span className="text-xs font-medium tracking-wide text-black/70 dark:text-white/70 font-[family-name:var(--font-inter)]">VERTO AI 2.0</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="text-5xl md:text-8xl font-bold tracking-tight text-black dark:text-white mb-8 font-[family-name:var(--font-inter-tight)] leading-[0.9]"
                        >
                            AI Presentations. <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#F55C7A] to-[#F6BC66]">Done.</span>
                        </motion.h1>

                        {/* Subtitle & CTA Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                                className="col-span-2 text-lg md:text-xl text-black/60 dark:text-white/50 leading-relaxed font-light font-[family-name:var(--font-inter)] tracking-wide"
                            >
                                Generate professional, investor-ready decks from your documents in seconds. No design skills required.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="col-span-1 flex flex-col gap-4"
                            >
                                <Link href="/create-page">
                                    <Button size="lg" className="w-full h-14 rounded-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 font-bold text-base transition-transform hover:scale-105">
                                        Generate Deck <Wand2 className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                                <div className="flex items-center gap-4 text-xs text-white/30 font-mono uppercase tracking-wider pl-4">
                                    <span>Scroll to explore</span>
                                    <div className="h-px w-8 bg-black/20 dark:bg-white/20" />
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* 4th Column - Empty/Reserved for Visual Balance or future content */}
                    <div className="hidden md:block col-span-1" />
                </div>
            </div>

            {/* Floating UI Mockup - Anchored to bottom/grid */}
            <div style={{ perspective: "2000px" }} className="w-full px-6 md:pl-[120px] md:pr-10 mt-20 md:mt-32">
                <motion.figure
                    style={{
                        rotateX: mockupRotateX,
                        scale: mockupScale,
                        y: mockupY,
                        opacity: mockupOpacity
                    }}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="w-full"
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="col-span-1 md:col-span-4 relative rounded-3xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0A] shadow-2xl overflow-hidden group">
                            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none z-20" />

                            {/* Fake UI Header */}
                            <div className="h-12 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-md flex items-center px-6 gap-4 relative z-10">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                </div>
                            </div>

                            {/* Content Preview */}
                            <div className="w-full relative overflow-hidden bg-white dark:bg-[#0A0A0A]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/hero/image.png"
                                    alt="Dashboard Interface"
                                    className="w-full h-[350px] md:h-auto object-cover object-left-top md:object-center"
                                />
                            </div>
                        </div>
                    </div>
                </motion.figure>
            </div>
        </section>
    );
}
