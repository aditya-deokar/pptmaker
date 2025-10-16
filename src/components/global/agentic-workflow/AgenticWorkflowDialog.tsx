'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import AgenticProgressTracker, { AgentStep, AgentStatus } from './AgenticProgressTracker'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'

interface AgenticWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
  topic: string
  steps?: readonly AgentStep[] | AgentStep[]
  currentProgress?: number
  currentAgentName?: string
  currentAgentDescription?: string
}

const AGENT_STEPS_CONFIG: Omit<AgentStep, 'status' | 'details'>[] = [
  {
    id: 'outline',
    name: 'Outline Generator',
    description: 'Creating presentation structure and key topics'
  },
  {
    id: 'content',
    name: 'Content Writer',
    description: 'Writing engaging content for each slide'
  },
  {
    id: 'layout',
    name: 'Layout Designer',
    description: 'Selecting optimal layouts and visual structure'
  },
  {
    id: 'image',
    name: 'Image Query Generator',
    description: 'Analyzing slides and generating image search queries'
  },
  {
    id: 'compiler',
    name: 'JSON Compiler',
    description: 'Compiling final presentation structure'
  }
]

const AgenticWorkflowDialog = ({ 
  open, 
  onOpenChange, 
  onComplete,
  topic,
  steps: externalSteps,
  currentProgress: externalProgress,
  currentAgentName,
  currentAgentDescription
}: AgenticWorkflowDialogProps) => {
  const [steps, setSteps] = useState<AgentStep[]>(
    externalSteps ? [...externalSteps] : AGENT_STEPS_CONFIG.map(step => ({ ...step, status: 'pending' as AgentStatus }))
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(externalProgress || 0)
  
  // Update steps when external steps change
  React.useEffect(() => {
    if (externalSteps) {
      setSteps([...externalSteps])
    }
  }, [externalSteps])

  // Update progress when external progress changes
  React.useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress)
    }
  }, [externalProgress])

  // Calculate overall progress
  const completedSteps = steps.filter(s => s.status === 'completed').length
  const totalSteps = steps.length
  const overallProgress = (completedSteps / totalSteps) * 100

  const updateStepStatus = (index: number, status: AgentStatus, details?: string) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status, details } : step
    ))
    if (status === 'running') {
      setCurrentStep(index)
    }
    if (status === 'completed' && index < totalSteps - 1) {
      setProgress(((index + 1) / totalSteps) * 100)
    } else if (status === 'completed' && index === totalSteps - 1) {
      setProgress(100)
    }
  }

  const handleCancel = () => {
    // Reset state
    setSteps(AGENT_STEPS_CONFIG.map(step => ({ ...step, status: 'pending' as AgentStatus })))
    setCurrentStep(0)
    setProgress(0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">AI Workflow in Progress</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Generating presentation: <span className="font-medium text-foreground">{topic}</span>
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {completedSteps} of {totalSteps} agents completed
          </div>
        </div>

        {/* Agent Steps */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <AgenticProgressTracker 
            steps={steps} 
            currentStep={currentStep}
            className="py-4"
          />
        </div>

        {/* Footer with status */}
        <AnimatePresence mode="wait">
          {progress === 100 ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Presentation generated successfully! 🎉
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                  All agents have completed their tasks
                </p>
              </div>
              <Button
                onClick={() => {
                  onComplete?.()
                  onOpenChange(false)
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                View Presentation
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="working"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  AI agents are working on your presentation
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">
                  This may take a few moments...
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleCancel}
                size="sm"
              >
                Cancel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default AgenticWorkflowDialog

// Export hook for easy usage
export const useAgenticWorkflow = () => {
  const [open, setOpen] = useState(false)
  const [steps, setSteps] = useState<AgentStep[]>(
    AGENT_STEPS_CONFIG.map(step => ({ ...step, status: 'pending' as AgentStatus }))
  )
  
  const updateStep = (stepId: string, status: AgentStatus, details?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, details } : step
    ))
  }

  const resetWorkflow = () => {
    setSteps(AGENT_STEPS_CONFIG.map(step => ({ ...step, status: 'pending' as AgentStatus })))
  }

  return {
    open,
    setOpen,
    steps,
    updateStep,
    resetWorkflow
  }
}
