"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { ShineBorder } from "../global/ui/shine-border"

export function VertoTestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      title: "Marketing Director",
      company: "TechFlow Inc.",
      image: "/placeholder.svg?height=60&width=60",
      quote: "Verto AI saved me at least 5 hours on my last client presentation.",
      fullText:
        "I was skeptical about AI-generated presentations, but Verto AI completely changed my mind. The quality is incredible, and it captures exactly what I want to communicate. It's become an essential part of my workflow.",
    },
    {
      name: "Michael Rodriguez",
      title: "Startup Founder",
      company: "InnovateLab",
      image: "/placeholder.svg?height=60&width=60",
      quote: "Our investor pitch went from good to outstanding thanks to Verto AI.",
      fullText:
        "As a non-designer, I always struggled with making presentations that looked professional. Verto AI not only made my slides beautiful but also helped structure my story in a way that resonated with investors.",
    },
    {
      name: "Dr. Emily Watson",
      title: "Professor",
      company: "Stanford University",
      image: "/placeholder.svg?height=60&width=60",
      quote: "My students are amazed by how quickly I can create engaging lecture materials.",
      fullText:
        "Verto AI has revolutionized how I prepare for classes. I can turn complex research papers into digestible presentations in minutes. My students are more engaged, and I have more time for actual teaching.",
    },
    {
      name: "James Park",
      title: "Consultant",
      company: "Strategy Partners",
      image: "/placeholder.svg?height=60&width=60",
      quote: "Client presentations have never been easier or more impressive.",
      fullText:
        "In consulting, presentation quality can make or break a deal. Verto AI ensures every deck I deliver looks polished and professional, even when I'm working under tight deadlines.",
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
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  }

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Don't Just Take Our{" "}
            <span className="verto">
              Word For It
            </span>
          </h2>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              variants={itemVariants}
            >
              <ShineBorder borderClassName="border border-white/10 rounded-xl h-full">
                <div className="p-6 h-full md:h-80 bg-primary/10 rounded-xl">
                  <motion.div
                    className="flex gap-1 mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 + i * 0.05 }}
                        viewport={{ once: true }}
                      >
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      </motion.div>
                    ))}
                  </motion.div>

                  <blockquote className="text-lg font-medium mb-4 text-primary">"{testimonial.quote}"</blockquote>

                  <p className="text-primary/70 mb-6 leading-relaxed">{testimonial.fullText}</p>

                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    {/* <motion.img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    /> */}
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">
                        {testimonial.title}, {testimonial.company}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </ShineBorder>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
