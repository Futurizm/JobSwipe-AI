"use client"
import { motion } from "framer-motion"
import { Briefcase, Search, ThumbsUp } from "lucide-react"

export default function WelcomeAnimation() {
  return (
    <div className="relative w-32 h-32 mb-4">
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
      >
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full animate-pulse-ring bg-gradient-to-br from-blue-500/10 to-cyan-400/10"></div>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute top-0 right-0"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="w-12 h-12 rounded-full bg-success-500 flex items-center justify-center shadow-lg animate-float">
          <ThumbsUp className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-0"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <div
          className="w-12 h-12 rounded-full bg-warning-500 flex items-center justify-center shadow-lg animate-float"
          style={{ animationDelay: "1s" }}
        >
          <Search className="w-6 h-6 text-white" />
        </div>
      </motion.div>
    </div>
  )
}
