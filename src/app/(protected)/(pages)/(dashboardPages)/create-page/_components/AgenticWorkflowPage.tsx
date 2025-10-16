'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, Loader2, Wand2, Brain, FileText, Palette, Image as ImageIcon, Package, Target, Search, ImagePlus, Database } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAgenticGenerationV2 } from '@/hooks/useAgenticGenerationV2'
import AgenticWorkflowDialog from '@/components/global/agentic-workflow/AgenticWorkflowDialog'
import { useSlideStore } from '@/store/useSlideStore'
import { containerVariants, itemVariants } from '@/lib/constants'

type Props = {
  onBack: () => void
}

const AGENT_INFO = [
  {
    icon: Target,
    name: 'Project Initializer',
    description: 'Creates your project in the database and sets up the foundation',
    color: 'text-purple-500'
  },
  {
    icon: Brain,
    name: 'Outline Generator',
    description: 'Analyzes your topic and creates a logical presentation structure',
    color: 'text-blue-500'
  },
  {
    icon: FileText,
    name: 'Content Writer',
    description: 'Writes engaging titles and compelling content for each slide',
    color: 'text-cyan-500'
  },
  {
    icon: Palette,
    name: 'Layout Selector',
    description: 'AI-powered layout selection for optimal visual presentation',
    color: 'text-pink-500'
  },
  {
    icon: Search,
    name: 'Image Query Generator',
    description: 'Creates contextual image queries to enhance your slides',
    color: 'text-green-500'
  },
  {
    icon: ImagePlus,
    name: 'Image Fetcher',
    description: 'Fetches high-quality images matching your content',
    color: 'text-yellow-500'
  },
  {
    icon: Package,
    name: 'JSON Compiler',
    description: 'Compiles everything into a beautiful, structured presentation',
    color: 'text-orange-500'
  },
  {
    icon: Database,
    name: 'Database Persister',
    description: 'Saves your complete presentation to the database',
    color: 'text-red-500'
  }
]

const AgenticWorkflowPage = ({ onBack }: Props) => {
  const router = useRouter()
  const { setSlides, setProject } = useSlideStore()
  const [presentationTitle, setPresentationTitle] = useState('')
  const [presentationTopic, setPresentationTopic] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')

  const { 
    generate, 
    isGenerating, 
    progress,
    currentAgentName,
    currentAgentDescription,
    error,
    agentSteps
  } = useAgenticGenerationV2()

  const handleGenerate = async () => {
    // Validation
    if (!presentationTitle.trim()) {
      toast.error("Error", {
        description: "Please enter a presentation title",
      })
      return
    }

    if (!presentationTopic.trim()) {
      toast.error("Error", {
        description: "Please enter a topic for your presentation",
      })
      return
    }

    try {
      // V2 workflow handles everything (project creation + AI generation)
      const fullTopic = `${presentationTitle}: ${presentationTopic}`
      
      await generate(fullTopic, additionalContext, 'light')
      
      // Success toast is shown after navigation in the hook
      
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to generate presentation",
      })
    }
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8 max-w-6xl mx-auto pb-12"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-primary flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              Agentic Workflow Generator
            </h1>
            <p className="text-secondary mt-2">
              Powered by 5 specialized AI agents working together to create your perfect presentation
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Input Form */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Presentation Details
                </CardTitle>
                <CardDescription>
                  Provide information about your presentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title Input */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold">
                    Presentation Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Machine Learning"
                    value={presentationTitle}
                    onChange={(e) => setPresentationTitle(e.target.value)}
                    className="text-base"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Give your presentation a clear, descriptive title
                  </p>
                </div>

                {/* Topic Input */}
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-base font-semibold">
                    Main Topic *
                  </Label>
                  <Textarea
                    id="topic"
                    placeholder="e.g., Explain the basics of machine learning, including supervised and unsupervised learning, neural networks, and real-world applications"
                    value={presentationTopic}
                    onChange={(e) => setPresentationTopic(e.target.value)}
                    rows={4}
                    className="text-base resize-none"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe what you want your presentation to cover
                  </p>
                </div>

                {/* Additional Context */}
                <div className="space-y-2">
                  <Label htmlFor="context" className="text-base font-semibold">
                    Additional Context (Optional)
                  </Label>
                  <Textarea
                    id="context"
                    placeholder="e.g., Target audience: college students with basic programming knowledge. Focus on practical examples. Include code snippets where relevant."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                    className="text-base resize-none"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add any specific requirements, target audience, or style preferences
                  </p>
                </div>

                {/* Generate Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 relative overflow-hidden group"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {/* Animated gradient overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear",
                      }}
                    />
                    
                    <span className="relative flex items-center gap-2">
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          Generating... {Math.round(progress)}%
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-6 w-6" />
                          Generate with AI Agents
                        </>
                      )}
                    </span>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Agent Information */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">The AI Agents</CardTitle>
                <CardDescription>
                  Eight specialized agents will work on your presentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {AGENT_INFO.map((agent, index) => (
                  <motion.div
                    key={agent.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={`flex-shrink-0 mt-1 ${agent.color}`}>
                      <agent.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-primary">
                        {index + 1}. {agent.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {agent.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Be specific about your topic</p>
                <p>✓ Mention target audience</p>
                <p>✓ Specify any style preferences</p>
                <p>✓ Include key points to cover</p>
                <p>✓ The more context, the better!</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Agentic Workflow Dialog */}
      <AgenticWorkflowDialog
        open={isGenerating}
        onOpenChange={() => {}}
        topic={presentationTitle || "Your Presentation"}
        steps={agentSteps}
        currentProgress={progress}
        currentAgentName={currentAgentName}
        currentAgentDescription={currentAgentDescription}
        onComplete={() => {
          // Navigation is handled in the hook after success
        }}
      />
    </>
  )
}

export default AgenticWorkflowPage
