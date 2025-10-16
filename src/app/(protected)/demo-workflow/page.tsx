'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AgenticProgressTracker, { AgentStep, AgentStatus } from '@/components/global/agentic-workflow/AgenticProgressTracker'
import AgenticWorkflowDialog from '@/components/global/agentic-workflow/AgenticWorkflowDialog'
import { Play, RotateCcw, Sparkles } from 'lucide-react'

const DEMO_STEPS: Omit<AgentStep, 'status'>[] = [
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

export default function AgenticWorkflowDemo() {
  const [steps, setSteps] = useState<AgentStep[]>(
    DEMO_STEPS.map(step => ({ ...step, status: 'pending' as AgentStatus }))
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const updateStep = (index: number, status: AgentStatus, details?: string) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status, details } : step
    ))
  }

  const simulateWorkflow = async () => {
    setIsRunning(true)
    
    for (let i = 0; i < DEMO_STEPS.length; i++) {
      setCurrentStep(i)
      
      // Set to running
      updateStep(i, 'running', `Processing ${DEMO_STEPS[i].name.toLowerCase()}...`)
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Set to completed
      updateStep(i, 'completed')
      
      // Wait a bit before next step
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRunning(false)
  }

  const simulateError = async () => {
    setIsRunning(true)
    
    for (let i = 0; i < 2; i++) {
      setCurrentStep(i)
      updateStep(i, 'running')
      await new Promise(resolve => setTimeout(resolve, 1500))
      updateStep(i, 'completed')
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    // Simulate error on third step
    setCurrentStep(2)
    updateStep(2, 'running', 'Attempting to generate layouts...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    updateStep(2, 'error', 'Failed to connect to layout service. Please try again.')
    
    setIsRunning(false)
  }

  const reset = () => {
    setSteps(DEMO_STEPS.map(step => ({ ...step, status: 'pending' as AgentStatus })))
    setCurrentStep(0)
    setIsRunning(false)
  }

  const simulateDialogWorkflow = async () => {
    setShowDialog(true)
    reset()
    await simulateWorkflow()
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Agentic Workflow UI</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A visual interface for multi-agent AI presentation generation. 
            Watch as five specialized agents work together to create your presentation.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="standalone" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="standalone">Standalone View</TabsTrigger>
            <TabsTrigger value="dialog">Dialog View</TabsTrigger>
          </TabsList>

          {/* Standalone Component Demo */}
          <TabsContent value="standalone" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Tracker Component</CardTitle>
                <CardDescription>
                  The AgenticProgressTracker component displays real-time agent status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Controls */}
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={simulateWorkflow}
                    disabled={isRunning}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Run Success Demo
                  </Button>
                  <Button
                    onClick={simulateError}
                    disabled={isRunning}
                    variant="outline"
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Run Error Demo
                  </Button>
                  <Button
                    onClick={reset}
                    disabled={isRunning}
                    variant="secondary"
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>

                {/* Progress Tracker */}
                <div className="max-w-2xl mx-auto">
                  <AgenticProgressTracker
                    steps={steps}
                    currentStep={currentStep}
                  />
                </div>

                {/* Status Info */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-2xl mx-auto">
                  {['pending', 'running', 'completed', 'error'].map((status) => {
                    const count = steps.filter(s => s.status === status).length
                    return (
                      <Card key={status}>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {status}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Code Example */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Example</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`import { AgenticProgressTracker } from '@/components/global/agentic-workflow'

const steps = [
  {
    id: 'outline',
    name: 'Outline Generator',
    description: 'Creating presentation structure',
    status: 'completed'
  },
  // ... more steps
]

<AgenticProgressTracker 
  steps={steps}
  currentStep={2}
/>`}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dialog Demo */}
          <TabsContent value="dialog" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Dialog Component</CardTitle>
                <CardDescription>
                  The AgenticWorkflowDialog provides a full-featured modal experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Click the button below to see the workflow dialog in action
                  </p>
                  <Button
                    onClick={simulateDialogWorkflow}
                    size="lg"
                    className="gap-2"
                  >
                    <Sparkles className="h-5 w-5" />
                    Launch Workflow Dialog
                  </Button>
                </div>

                {/* Features List */}
                <div className="grid md:grid-cols-2 gap-4 mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          ✓ Real-time progress updates
                        </li>
                        <li className="flex items-center gap-2">
                          ✓ Overall progress bar
                        </li>
                        <li className="flex items-center gap-2">
                          ✓ Individual agent status
                        </li>
                        <li className="flex items-center gap-2">
                          ✓ Error handling
                        </li>
                        <li className="flex items-center gap-2">
                          ✓ Success animations
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Agent Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {DEMO_STEPS.map((step, i) => (
                          <li key={step.id} className="flex items-center gap-2">
                            {i + 1}. {step.name}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Code Example */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Example</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`import { AgenticWorkflowDialog } from '@/components/global/agentic-workflow'

const [showDialog, setShowDialog] = useState(false)

<AgenticWorkflowDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  topic="Introduction to AI"
  onComplete={() => {
    console.log('Workflow completed!')
    router.push('/presentation/123')
  }}
/>`}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog */}
      <AgenticWorkflowDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        topic="Introduction to AI"
        steps={steps}
        onComplete={() => {
          console.log('Demo workflow completed!')
        }}
      />
    </div>
  )
}
