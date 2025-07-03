"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { TrendingUp, Rocket, GraduationCap, Briefcase } from "lucide-react"
import { ShineBorder } from "../global/ui/shine-border"

export function VertoUseCasesSection() {
  const [activeTab, setActiveTab] = useState("marketers")

  const useCases = {
    marketers: {
      title: "For Marketers",
      description: "Create pitch decks, campaign reports, and social media carousels in minutes, not hours.",
      icon: <TrendingUp className="w-6 h-6" />,
      features: ["Campaign Reports", "Pitch Decks", "Social Media Content", "Performance Analytics"],
    },
    founders: {
      title: "For Founders",
      description: "Craft compelling investor pitches and company updates that captivate your audience.",
      icon: <Rocket className="w-6 h-6" />,
      features: ["Investor Pitches", "Company Updates", "Product Launches", "Board Presentations"],
    },
    students: {
      title: "For Students",
      description: "Turn your research notes and essays into A+ presentations for class projects and assignments.",
      icon: <GraduationCap className="w-6 h-6" />,
      features: ["Class Projects", "Research Presentations", "Thesis Defense", "Study Materials"],
    },
    consultants: {
      title: "For Consultants",
      description:
        "Quickly generate client reports, project proposals, and workshop materials that look polished and professional.",
      icon: <Briefcase className="w-6 h-6" />,
      features: ["Client Reports", "Project Proposals", "Workshop Materials", "Strategy Decks"],
    },
  }

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Built for Every{" "}
            <span className="verto">
              Storyteller
            </span>
          </h2>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {Object.entries(useCases).map(([key, useCase], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={activeTab === key ? "default" : "outline"}
                onClick={() => setActiveTab(key)}
                className={`gap-2 ${
                  activeTab === key
                    ? "verto-bg"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                {useCase.icon}
                {useCase.title}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <ShineBorder borderClassName="border border-white/10 rounded-xl">
              <div className="p-8 bg-primary/10 rounded-xl">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <h3 className="text-2xl font-bold mb-4">{useCases[activeTab as keyof typeof useCases].title}</h3>
                    <p className="text-primary text-lg mb-6 leading-relaxed">
                      {useCases[activeTab as keyof typeof useCases].description}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {useCases[activeTab as keyof typeof useCases].features.map((feature, index) => (
                        <motion.div
                          key={feature}
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                        >
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500"></div>
                          <span className="text-sm text-primary/80">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                  <motion.div
                    className="aspect-video bg-gradient-to-br from-gray-900 to-black rounded-lg border border-white/10 flex items-center justify-center"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <div className="text-center">
                      <motion.div
                        className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {useCases[activeTab as keyof typeof useCases].icon}
                      </motion.div>
                      <p className="text-gray-400">Preview Coming Soon</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </ShineBorder>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
