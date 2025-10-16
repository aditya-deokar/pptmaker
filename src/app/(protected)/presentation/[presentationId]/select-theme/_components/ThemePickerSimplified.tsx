// Example: How to integrate useAgenticGeneration hook into ThemePicker
// File: src/app/(protected)/presentation/[presentationId]/select-theme/_components/ThemePickerSimplified.tsx

'use client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Theme } from '@/lib/types'
import { useSlideStore } from '@/store/useSlideStore'
import { Sparkles } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useAgenticGeneration } from '@/hooks/useAgenticGeneration'
import AgenticWorkflowDialog from '@/components/global/agentic-workflow/AgenticWorkflowDialog'

type Props = {
    selectedTheme: Theme
    themes: Theme[]
    onThemeSelect: (theme: Theme) => void
}

/**
 * Simplified ThemePicker with integrated agentic workflow
 * This version uses the useAgenticGeneration hook for cleaner code
 */
const ThemePickerSimplified = ({ onThemeSelect, selectedTheme, themes }: Props) => {
    const router = useRouter()
    const params = useParams()
    const { project, setSlides } = useSlideStore()

    // Use the custom hook for workflow management
    const { 
        generate, 
        steps, 
        isGenerating, 
        progress 
    } = useAgenticGeneration({
        onSuccess: (data) => {
            // Set slides in store
            setSlides(data)
            
            // Show success message
            toast.success("Success", {
                description: "Presentation generated successfully! 🎉",
            })
            
            // Navigate to presentation after a short delay
            setTimeout(() => {
                router.push(`/presentation/${project?.id}`)
            }, 1500)
        },
        onError: (error) => {
            // Show error toast
            toast.error("Error", {
                description: error.message || "Failed to generate presentation",
            })
        }
    })

    const handleGenerate = async () => {
        // Validation
        if (!selectedTheme) {
            toast.error("Error", {
                description: "Please select a theme",
            })
            return
        }

        if (!project?.id) {
            toast.error("Error", {
                description: "Please create a project first",
            })
            router.push("/create-page")
            return
        }

        // Start generation with the project title
        try {
            await generate(project.title || "Introduction to AI")
        } catch (error) {
            // Error already handled in hook
            console.error('Generation failed:', error)
        }
    }

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
                    {/* Header */}
                    <div className='space-y-2'>
                        <h2 
                            className='text-3xl font-bold tracking-tight'
                            style={{ color: selectedTheme.accentColor }}
                        >
                            Pick a Theme
                        </h2>
                        <p 
                            className='text-sm'
                            style={{ color: `${selectedTheme.accentColor}80` }}
                        >
                            Choose from our curated collection
                        </p>
                    </div>

                    {/* Generate Button */}
                    <Button
                        className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                        style={{
                            backgroundColor: selectedTheme.accentColor,
                            color: selectedTheme.backgroundColor,
                        }}
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        <Sparkles className="mr-2 h-5 w-5" />
                        {isGenerating 
                            ? `Generating... ${Math.round(progress)}%` 
                            : "Generate with AI"
                        }
                    </Button>
                </div>

                {/* Theme Selection */}
                <ScrollArea className='flex-grow px-8 pb-8'>
                    <div className='grid grid-cols-1 gap-4 px-2'>
                        {themes.map((theme) => (
                            <motion.div
                                key={theme.name}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    onClick={() => onThemeSelect(theme)}
                                    className='flex flex-col items-center justify-start p-6 w-full h-auto'
                                    style={{
                                        fontFamily: theme.fontFamily,
                                        color: theme.fontColor,
                                        background: theme.gradientBackground || theme.backgroundColor,
                                    }}
                                >
                                    <div className='w-full flex items-center justify-between'>
                                        <span className='text-xl font-bold'>{theme.name}</span>
                                        <div 
                                            className='w-3 h-3 rounded-full'
                                            style={{ backgroundColor: theme.accentColor }}
                                        />
                                    </div>
                                    <div className='space-y-1 w-full'>
                                        <div 
                                            className='text-2xl font-bold'
                                            style={{ color: theme.accentColor }}
                                        >
                                            Title
                                        </div>
                                        <div className='text-base opacity-80'>
                                            Body &{' '}
                                            <span style={{ color: theme.accentColor }}>
                                                link
                                            </span>
                                        </div>
                                    </div>
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Workflow Dialog - automatically managed by the hook */}
            <AgenticWorkflowDialog
                open={isGenerating}
                onOpenChange={() => {}} // Controlled by the hook
                topic={project?.title || "Your Presentation"}
                steps={steps}
            />
        </>
    )
}

export default ThemePickerSimplified

/**
 * Key Benefits of using useAgenticGeneration:
 * 
 * 1. ✅ Cleaner code - all workflow logic in one hook
 * 2. ✅ Automatic progress tracking
 * 3. ✅ Built-in error handling
 * 4. ✅ Success/error callbacks
 * 5. ✅ Progress percentage calculation
 * 6. ✅ Easy to test and maintain
 * 7. ✅ Reusable across components
 * 8. ✅ TypeScript support
 * 
 * Compare this with ThemePickerWithWorkflow.tsx to see the difference!
 */
