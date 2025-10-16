// /components/ThemePickerWithWorkflow.tsx

'use client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Theme } from '@/lib/types'
import { useSlideStore } from '@/store/useSlideStore'
import { Loader2, Wand2, Sparkles } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { generatePresentationGraph } from '@/agentic-workflow/actions/genai-graph'
import AgenticWorkflowDialog from '@/components/global/agentic-workflow/AgenticWorkflowDialog'
import { AgentStatus } from '@/components/global/agentic-workflow'

type Props = {
    selectedTheme: Theme
    themes: Theme[]
    onThemeSelect: (theme: Theme) => void
}

// Mock function to simulate agent progress - replace with actual implementation
const simulateAgentProgress = (
    updateCallback: (stepId: string, status: AgentStatus, details?: string) => void
) => {
    const steps = ['outline', 'content', 'layout', 'image', 'compiler']
    let currentIndex = 0

    const interval = setInterval(() => {
        if (currentIndex < steps.length) {
            // Mark current as running
            updateCallback(steps[currentIndex], 'running', `Processing ${steps[currentIndex]}...`)
            
            // After 2 seconds, mark as completed and move to next
            setTimeout(() => {
                updateCallback(steps[currentIndex], 'completed')
                currentIndex++
                
                if (currentIndex >= steps.length) {
                    clearInterval(interval)
                }
            }, 2000)
        }
    }, 2500)

    return interval
}

const ThemePickerWithWorkflow = ({ onThemeSelect, selectedTheme, themes }: Props) => {
    const router = useRouter();
    const params = useParams();
    const { project, setSlides, currentTheme } = useSlideStore();
    const [loading, setLoading] = useState(false);
    const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
    const [workflowSteps, setWorkflowSteps] = useState<Array<{
        id: string;
        name: string;
        description: string;
        status: AgentStatus;
        details?: string;
    }>>([
        {
            id: 'outline',
            name: 'Outline Generator',
            description: 'Creating presentation structure and key topics',
            status: 'pending'
        },
        {
            id: 'content',
            name: 'Content Writer',
            description: 'Writing engaging content for each slide',
            status: 'pending'
        },
        {
            id: 'layout',
            name: 'Layout Designer',
            description: 'Selecting optimal layouts and visual structure',
            status: 'pending'
        },
        {
            id: 'image',
            name: 'Image Query Generator',
            description: 'Analyzing slides and generating image search queries',
            status: 'pending'
        },
        {
            id: 'compiler',
            name: 'JSON Compiler',
            description: 'Compiling final presentation structure',
            status: 'pending'
        }
    ])

    const updateStepStatus = (stepId: string, status: AgentStatus, details?: string) => {
        setWorkflowSteps(prev => prev.map(step =>
            step.id === stepId ? { ...step, status, details } : step
        ))
    }

    const resetWorkflow = () => {
        setWorkflowSteps(prev => prev.map(step => ({
            ...step,
            status: 'pending' as AgentStatus,
            details: undefined
        })))
    }

    const handleGenerateWithWorkflow = async () => {
        setLoading(true);
        
        if (!selectedTheme) {
            toast.error("Error", {
                description: "Please select a theme",
            });
            setLoading(false);
            return;
        }
        
        if (!project?.id) {
            toast.error("Error", {
                description: "Please create a project first",
            });
            router.push("/create-page");
            setLoading(false);
            return;
        }

        // Reset and show workflow dialog
        resetWorkflow();
        setShowWorkflowDialog(true);

        try {
            // Start the workflow visualization
            const progressInterval = simulateAgentProgress(updateStepStatus);

            // Call the actual generation function
            const res = await generatePresentationGraph(
                project.title || "Introduction to AI"
            );

            // Clear the simulation interval
            clearInterval(progressInterval);

            // Mark all as completed
            workflowSteps.forEach(step => {
                updateStepStatus(step.id, 'completed');
            });

            // Check response
            if (!res || res.status !== 200 || !res.data) {
                throw new Error(res.error || "Failed to generate presentation");
            }

            toast.success("Success", {
                description: "Presentation generated successfully! 🎉",
            });

            setSlides(res.data);
            
            // Auto-close dialog after 2 seconds and navigate
            setTimeout(() => {
                setShowWorkflowDialog(false);
                router.push(`/presentation/${project.id}`);
            }, 2000);

        } catch (err: any) {
            // Mark current step as error
            const currentStep = workflowSteps.find(s => s.status === 'running');
            if (currentStep) {
                updateStepStatus(currentStep.id, 'error', err.message);
            }
            
            toast.error("Error", {
                description: err.message || "Failed to generate presentation",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div
                className='w-[400px] overflow-hidden sticky top-0 h-screen flex flex-col'
                style={{
                    backgroundColor: selectedTheme.sidebarColor || selectedTheme.backgroundColor,
                    borderLeft: `1px solid ${selectedTheme.accentColor}20`,
                }}
            >
                <div className='p-8 space-y-6 flex-shrink-0'>
                    <div className='space-y-2'>
                        <h2 className='text-3xl font-bold tracking-tight'
                            style={{
                                color: selectedTheme.accentColor
                            }}>
                            Pick a Theme
                        </h2>
                        <p className='text-sm'
                            style={{
                                color: `${selectedTheme.accentColor}80`
                            }}>
                            Choose from our curated collection
                        </p>
                    </div>
                    
                    {/* Enhanced Generate Button with AI Badge */}
                    <div className="space-y-3">
                        <Button
                            className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                            style={{
                                backgroundColor: selectedTheme.accentColor,
                                color: selectedTheme.backgroundColor,
                            }}
                            onClick={handleGenerateWithWorkflow}
                            disabled={loading}
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
                            
                            <span className="relative flex items-center">
                                {loading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-5 w-5" />
                                )}
                                {loading ? "Generating..." : "Generate with AI"}
                            </span>
                        </Button>
                        
                        {/* AI Features Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-2 text-xs"
                            style={{ color: `${selectedTheme.accentColor}70` }}
                        >
                            <Wand2 className="h-3 w-3" />
                            <span>Multi-agent AI workflow</span>
                        </motion.div>
                    </div>
                </div>
                
                <ScrollArea className='flex-grow px-8 pb-8'>
                    <div className='grid grid-cols-1 gap-4 px-2'>
                        {themes.map((theme) => (
                            <motion.div
                                key={theme.name}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    onClick={() => {
                                        onThemeSelect(theme)
                                    }}
                                    className='flex flex-col items-center justify-start p-6 w-full h-auto'
                                    style={{
                                        fontFamily: theme.fontFamily,
                                        color: theme.fontColor,
                                        background: theme.gradientBackground || theme.backgroundColor,
                                    }}
                                >
                                    <div className='w-full flex items-center justify-between'>
                                        <span className='text-xl font-bold'>{theme.name}</span>
                                        <div className='w-3 h-3 rounded-full'
                                            style={{ backgroundColor: theme.accentColor }}
                                        />
                                    </div>
                                    <div className='space-y-1 w-full'>
                                        <div className='text-2xl font-bold'
                                            style={{
                                                color: theme.accentColor
                                            }}>Title</div>
                                        <div className='text-base opacity-80'>
                                            Body &{' '}
                                            <span className=''
                                                style={{
                                                    color: theme.accentColor
                                                }}>link</span>
                                        </div>
                                    </div>
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Agentic Workflow Dialog */}
            <AgenticWorkflowDialog
                open={showWorkflowDialog}
                onOpenChange={setShowWorkflowDialog}
                topic={project?.title || "Your Presentation"}
                steps={workflowSteps}
                onComplete={() => {
                    router.push(`/presentation/${project?.id}`);
                }}
            />
        </>
    )
}

export default ThemePickerWithWorkflow;
