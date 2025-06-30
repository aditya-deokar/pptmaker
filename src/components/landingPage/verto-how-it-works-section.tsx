"use client"

import { motion } from "framer-motion"
import { Lightbulb, Brain, CheckCircle } from "lucide-react"
import { ShineBorder } from "../global/ui/shine-border"

export function VertoHowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Spark the Idea",
      description:
        "Start with a single topic, a detailed prompt, or even a messy document. Tell Verto AI what you want to communicate.",
      icon: <Lightbulb className="w-8 h-8 text-red-500" />,
    },
    {
      number: "02",
      title: "Let AI Work Its Magic",
      description:
        "Our AI outlines your story, writes compelling content for each slide, and applies modern, professional design with relevant visuals.",
      icon: <Brain className="w-8 h-8 text-orange-500" />,
    },
    {
      number: "03",
      title: "Present and Polish",
      description:
        "In seconds, you get a complete deck ready to go. Easily edit any text, swap images, or fine-tune the design to make it perfectly yours.",
      icon: <CheckCircle className="w-8 h-8 text-yellow-500" />,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
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
          <h2 className="text-3xl md:text-5xl font-bold mb-4 verto">
            Create a Polished Deck in 3 Simple Steps
          </h2>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ShineBorder borderClassName="border border-secondary/40 rounded-xl h-full">
                <div className="p-8 h-full bg-background/50 rounded-xl">
                  <motion.div
                    className="text-6xl font-bold text-primary/30 mb-4"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    {step.number}
                  </motion.div>
                  <motion.div
                    className="mb-6 p-3 rounded-full bg-white/5 w-fit"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {step.icon}
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-primary/55 leading-relaxed">{step.description}</p>
                </div>
              </ShineBorder>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
