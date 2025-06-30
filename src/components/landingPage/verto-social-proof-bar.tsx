"use client"

import { motion } from "framer-motion"
import { Marquee } from "../global/ui/marquee"


export function VertoSocialProofBar() {
  const companies = ["Google", "Slack", "Notion", "HubSpot", "Microsoft", "Figma", "Spotify", "Airbnb"]

  return (
    <motion.section
      className="py-12 border-y border-white/10"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.p
          className="text-center text-gray-400 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Trusted by professionals and teams at
        </motion.p>
        <Marquee pauseOnHover>
          {companies.map((company, index) => (
            <motion.div
              key={company}
              className="mx-8 text-2xl font-semibold text-gray-600"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.1, color: "#ffffff" }}
            >
              {company}
            </motion.div>
          ))}
        </Marquee>
      </div>
    </motion.section>
  )
}
