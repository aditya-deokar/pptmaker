"use client"

import { motion } from "framer-motion"

import { Zap, Palette, ImageIcon, RefreshCw, Brush, Share2 } from "lucide-react"
import { ShineBorder } from "../global/ui/shine-border"

export function VertoFeaturesSection() {
  const features = [
    {
      title: "AI Content Generation",
      benefit: "Beat writer's block and save hours. Go from idea to a full first draft in seconds.",
      icon: <Zap className="w-6 h-6 text-red-500" />,
    },
    {
      title: "Intelligent, Modern Design",
      benefit:
        "Look like a professional designer without the effort. Our AI chooses layouts, fonts, and colors that work.",
      icon: <Palette className="w-6 h-6 text-orange-500" />,
    },
    {
      title: "Royalty-Free Visuals",
      benefit:
        "Bring your story to life. Verto AI automatically finds and inserts relevant, high-quality images and icons.",
      icon: <ImageIcon className="w-6 h-6 text-yellow-500" />,
    },
    {
      title: "Reformat & Repurpose",
      benefit: "Turn any content—a blog post, a PDF, or notes—into a presentation with one click.",
      icon: <RefreshCw className="w-6 h-6 text-red-500" />,
    },
    {
      title: "Brand Consistency",
      benefit:
        "(For Pro users) Apply your own logos, colors, and fonts to every presentation for a consistent brand image.",
      icon: <Brush className="w-6 h-6 text-orange-500" />,
    },
    {
      title: "Easy Editing & Sharing",
      benefit: "Fine-tune with our intuitive editor and share your deck with a single link.",
      icon: <Share2 className="w-6 h-6 text-yellow-500" />,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  return (
    <section className="py-16 px-6 bg-background/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            More Than a Tool, It's Your{" "}
            <span className="verto">
              AI Co-Pilot
            </span>
          </h2>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ShineBorder borderClassName="border border-secondary/30 rounded-xl h-full">
                <div className="p-6 h-full bg-background/80 rounded-xl">
                  <motion.div
                    className="mb-4 p-3 rounded-full bg-white/5 w-fit"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-primary/55 leading-relaxed">{feature.benefit}</p>
                </div>
              </ShineBorder>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
