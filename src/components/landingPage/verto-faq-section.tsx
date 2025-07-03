"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function VertoFaqSection() {
  const faqs = [
    {
      question: "How does the AI work? What data is it trained on?",
      answer:
        "Verto AI uses advanced language models trained on a diverse dataset of high-quality presentations, design principles, and content structures. Our AI understands context, maintains consistency, and generates human-like content while respecting privacy and data security.",
    },
    {
      question: "Is my data private and secure?",
      answer:
        "Absolutely. We take data privacy seriously. Your presentations and prompts are encrypted in transit and at rest. We don't use your content to train our models, and you maintain full ownership of everything you create with Verto AI.",
    },
    {
      question: "Can I export my presentations?",
      answer:
        "Yes! Pro users can export presentations in multiple formats including PDF, PPTX (PowerPoint), and high-resolution images. Free users can export to PDF with Verto AI branding.",
    },
    {
      question: "Can I use my own brand colors and logo?",
      answer:
        "Pro users have full access to custom branding features. You can upload your logo, set custom color palettes, choose fonts, and create brand templates that automatically apply to all your presentations.",
    },
    {
      question: "What happens when I hit my limit on the free plan?",
      answer:
        "When you reach your monthly limit on the free plan, you'll be prompted to upgrade to Pro for unlimited access. Alternatively, your limit resets at the beginning of each month, so you can continue using the free features.",
    },
    {
      question: "How accurate is the AI-generated content?",
      answer:
        "Our AI is highly sophisticated and generates contextually relevant, well-structured content. However, we always recommend reviewing and customizing the output to match your specific needs and voice. Think of it as your intelligent first draft.",
    },
  ]

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Questions? We have{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">answers</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="border border-white/10 rounded-xl overflow-hidden bg-primary/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.01 }}
            >
              <motion.button
                className="flex justify-between items-center w-full p-6 text-left hover:bg-white/5 transition-colors"
                onClick={() => toggleFaq(index)}
                whileTap={{ scale: 0.99 }}
              >
                <span className="font-medium text-lg pr-4">{faq.question}</span>
                <motion.div animate={{ rotate: openIndex === index ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown className="h-5 w-5 shrink-0" />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5">{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
