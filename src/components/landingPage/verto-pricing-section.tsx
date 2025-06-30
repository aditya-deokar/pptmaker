"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, Zap } from "lucide-react"
import { ShineBorder } from "../global/ui/shine-border"

export function VertoPricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "",
      description: "Perfect for getting started with the Pomodoro technique",
      features: [
        "3 presentations/month",
        "Basic AI generation",
        "Standard templates",
        "Verto AI branding",
        "Community support",
      ],
      buttonText: "Get Started for Free",
      buttonVariant: "outline" as const,
      highlight: false,
    },
    {
      name: "Pro",
      price: isAnnual ? "$8" : "$10",
      period: "per month",
      originalPrice: isAnnual ? "$10" : "",
      description: "Advanced features for serious productivity enthusiasts",
      features: [
        "Unlimited presentations",
        "Advanced AI generation",
        "Custom branding & themes",
        "AI image generation",
        "Export to PDF/PPTX",
        "Priority support",
        "Analytics & insights",
      ],
      buttonText: "Start Your Pro Trial",
      buttonVariant: "default" as const,
      highlight: true,
    },
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Simple, Transparent{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">Pricing</span>
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Choose the plan that fits your productivity needs</p>

          <motion.div
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <span className={`text-sm ${!isAnnual ? "text-white" : "text-gray-400"}`}>Monthly</span>
            <motion.button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isAnnual ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gray-600"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute w-5 h-5 bg-white rounded-full top-0.5"
                animate={{ x: isAnnual ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
            <span className={`text-sm ${isAnnual ? "text-white" : "text-gray-400"}`}>
              Annually
              <span className="ml-1 text-xs bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <ShineBorder
                className={`h-full ${plan.highlight ? "z-10" : ""}`}
                borderClassName={`border ${plan.highlight ? "border-red-500/50" : "border-white/10"} rounded-xl`}
              >
                <div
                  className={`p-8 h-full ${plan.highlight ? "bg-gradient-to-b from-black to-black/80" : "bg-black/50"} rounded-xl relative`}
                >
                  {plan.highlight && (
                    <motion.div
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                      initial={{ opacity: 0, y: -10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      viewport={{ once: true }}
                    >
                      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Most Popular
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-end gap-2 mb-2">
                      <motion.span
                        className="text-4xl font-bold"
                        key={plan.price}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {plan.price}
                      </motion.span>
                      {plan.originalPrice && (
                        <span className="text-lg text-gray-400 line-through">{plan.originalPrice}</span>
                      )}
                      {plan.period && <span className="text-gray-400 mb-1">{plan.period}</span>}
                    </div>
                    <p className="text-gray-400">{plan.description}</p>
                  </motion.div>

                  <motion.ul
                    className="space-y-4 mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    {plan.features.map((feature, featureIndex) => (
                      <motion.li
                        key={feature}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + featureIndex * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </motion.li>
                    ))}
                  </motion.ul>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant={plan.buttonVariant}
                      className={`w-full ${
                        plan.highlight
                          ? "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:opacity-90"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
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
