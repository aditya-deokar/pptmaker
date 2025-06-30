"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Play } from "lucide-react"
import { InteractiveGrid } from "../global/ui/interactive-grid"
import { ShineBorder } from "../global/ui/shine-border"
import Link from "next/link"
import { ThemeSwitcher } from "../global/mode-toggle"

export function VertoHeroSection() {
  return (
    <section className="relative min-h-screen pt-32 pb-16 overflow-hidden hero-gradient">

      <ThemeSwitcher/>
      <InteractiveGrid containerClassName="absolute inset-0" className="opacity-30" points={40} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h1
            className="text-4xl md:text-[5.5vw] font-bold mb-6 tracking-tight leading-none"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Turn Your Ideas Into
            <br />
            <motion.span
              className="verto md:text-[5.9vw]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              Stunning Presentations
            </motion.span>
            <br />
            Instantly.
          </motion.h1>

          <motion.p
            className="text-primary/50 text-sm md:text-lg mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Verto AI is your intelligent partner that writes, designs, and structures your entire deck from a single
            prompt. Ditch the blank slide forever.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <ShineBorder className="max-w-md mx-auto mb-6" borderClassName="border border-white/10 rounded-xl">
              <div className="flex gap-2 p-2 bg-background/80 rounded-xl">
                <Input
                  placeholder="Enter Prompt"
                  className="border-none outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus:border-transparent shadow-none"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                  className="verto-bg hover:opacity-90 gap-2 px-6">
                    <Link href={'/dashboard'}>Generate Your First Presentation</Link>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </ShineBorder>
          </motion.div>

          <motion.p
            className="text-primary/30 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            No credit card required. Get started for free.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
        >
          <ShineBorder
            className="relative mx-auto max-w-4xl"
            borderClassName="border border-white/10 rounded-xl overflow-hidden"
          >
            <div className="relative bg-background/80 p-8 rounded-xl">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center border border-white/10">
                <div className="text-center">
                  <motion.div
                    className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Play className="w-8 h-8 text-white ml-1" />
                  </motion.div>
                  <p className="text-gray-400 mb-2">Watch Verto AI in Action</p>
                  <p className="text-sm text-gray-500">See how a simple prompt becomes a complete presentation</p>
                </div>
              </div>
            </div>
          </ShineBorder>
        </motion.div>
      </div>
    </section>
  )
}
