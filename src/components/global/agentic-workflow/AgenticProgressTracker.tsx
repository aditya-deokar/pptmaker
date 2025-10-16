'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AgentStatus = 'pending' | 'running' | 'completed' | 'error'

export interface AgentStep {
  id: string
  name: string
  description: string
  status: AgentStatus
  details?: string
}

interface AgenticProgressTrackerProps {
  steps: AgentStep[]
  currentStep: number
  className?: string
}

const AgenticProgressTracker = ({ 
  steps, 
  currentStep,
  className 
}: AgenticProgressTrackerProps) => {
  
  const getStatusIcon = (status: AgentStatus, isActive: boolean) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />
      case 'running':
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return (
          <Circle 
            className={cn(
              "h-6 w-6",
              isActive ? "text-blue-500" : "text-gray-400"
            )} 
          />
        )
    }
  }

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-950/20'
      case 'running':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20'
      default:
        return 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950'
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isCompleted = step.status === 'completed'
        const isRunning = step.status === 'running'
        const hasError = step.status === 'error'

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Connection Line */}
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "absolute left-3 top-12 w-0.5 h-8 transition-colors",
                  isCompleted ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"
                )}
              />
            )}

            {/* Step Card */}
            <motion.div
              animate={isRunning ? {
                scale: [1, 1.02, 1],
                transition: { repeat: Infinity, duration: 2 }
              } : {}}
              className={cn(
                "border-2 rounded-lg p-4 transition-all duration-300",
                getStatusColor(step.status),
                isActive && "shadow-lg",
              )}
            >
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(step.status, isActive)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={cn(
                      "font-semibold text-base",
                      isActive && "text-blue-600 dark:text-blue-400"
                    )}>
                      {step.name}
                    </h3>
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      step.status === 'completed' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      step.status === 'running' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                      step.status === 'error' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      step.status === 'pending' && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    )}>
                      {step.status === 'running' ? 'In Progress' : 
                       step.status === 'completed' ? 'Done' :
                       step.status === 'error' ? 'Failed' : 'Pending'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {step.description}
                  </p>

                  {/* Additional Details */}
                  {step.details && isRunning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-gray-500 dark:text-gray-500 mt-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800"
                    >
                      {step.details}
                    </motion.div>
                  )}

                  {/* Error Details */}
                  {step.details && hasError && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900">
                      {step.details}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default AgenticProgressTracker
