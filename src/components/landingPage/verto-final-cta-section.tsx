"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Sparkles } from "lucide-react"
import { ShineBorder } from "../global/ui/shine-border"

export function VertoFinalCtaSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <ShineBorder borderClassName="border border-red-500/30 rounded-xl">
            <div className="p-12 bg-gradient-to-br from-black via-black to-red-900/20 rounded-xl text-center">
              <motion.div
                className="mb-6"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.div whileHover={{ scale: 1.2, rotate: 10 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-red-500" />
                </motion.div>
              </motion.div>

              <motion.h2
                className="text-3xl md:text-5xl font-bold mb-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
              >
                Ready to Revolutionize Your{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                  Presentations?
                </span>
              </motion.h2>

              <motion.p
                className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                viewport={{ once: true }}
              >
                Join thousands of users saving time and creating better decks with the power of AI.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                viewport={{ once: true }}
              >
                <ShineBorder className="max-w-md mx-auto mb-6" borderClassName="border border-white/10 rounded-xl">
                  <div className="flex gap-2 p-2 bg-black/80 rounded-xl">
                    <Input
                      placeholder="Enter your email address"
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:opacity-90 gap-2 px-6">
                        Generate Your First Presentation for Free
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </div>
                </ShineBorder>
              </motion.div>

              <motion.p
                className="text-gray-500 text-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                viewport={{ once: true }}
              >
                No credit card required • 3 free presentations to start • Upgrade anytime
              </motion.p>
            </div>
          </ShineBorder>
        </motion.div>
      </div>
    </section>
  )
}
