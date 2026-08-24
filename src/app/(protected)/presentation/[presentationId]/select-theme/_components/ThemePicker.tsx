// /components/ThemePicker.tsx

'use client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Theme } from '@/lib/types'
import { useSlideStore } from '@/store/useSlideStore'
import { Loader2, Wand2, CheckCircle2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useAgenticGenerationV2 } from '@/hooks/useAgenticGenerationV2'
import AgenticWorkflowDialog from '@/components/global/agentic-workflow/AgenticWorkflowDialog'

type Props = {
    selectedTheme:Theme
    themes:Theme[]
    onThemeSelect: (theme:Theme)=> void
}

const ThemePicker = ({onThemeSelect, selectedTheme, themes}: Props) => {
    const router = useRouter();
    const params = useParams();
    const { project, setSlides, currentTheme } = useSlideStore();
    const {
        generate,
        isGenerating,
        progress,
        currentAgentName,
        currentAgentDescription,
        agentSteps,
        runId,
        stream,
    } = useAgenticGenerationV2();

    const handleGenerateLayouts = async () => {
        if (!selectedTheme) {
            toast.error("Error", {
                description: "Please select a theme",
            });
            return;
        }
        if (!project?.id) {
            toast.error("Error", {
                description: "Please create a project first",
            });
            router.push("/create-page");
            return;
        }

        try {
            await generate(
                project.title || "Untitled Presentation",
                undefined,
                selectedTheme.name,
                project.outlines || [],
                project.id
            );
        } catch (err: any)  {
            toast.error("Error", {
                description: err.message || "Failed to generate layouts",
            });
        }
    };

    return (
      <div
        className='w-[400px] overflow-hidden sticky top-0 h-screen flex flex-col z-20 shadow-2xl backdrop-blur-xl'
        style={{
          backgroundColor: (selectedTheme.sidebarColor || selectedTheme.backgroundColor) + 'ee',
          borderLeft:`1px solid ${selectedTheme.accentColor}20`,
        }}
      >
        <div className='p-8 space-y-6 shrink-0'>
          <div className='space-y-2'>
            <h2 className='text-3xl font-bold tracking-tight'
            style={{
              color:selectedTheme.accentColor
            }}>
              Pick a Theme
            </h2>
            <p className='text-sm'
            style={{
              color:`${selectedTheme.accentColor}80`
            }}>Choose from our curated collection or generate a custom theme</p>
          </div>
            <Button
            className="w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-full group overflow-hidden relative"
            style={{
              backgroundColor: selectedTheme.accentColor,
              color: selectedTheme.backgroundColor,
            }}
            onClick={handleGenerateLayouts}
            disabled={isGenerating}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            {isGenerating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
            )}
            {isGenerating ? "Generating..." : "Generate Presentation"}
          </Button>
        </div>
        <ScrollArea className='grow px-8 pb-8'>
            <div className='grid grid-cols-1 gap-4 px-1 pb-4'>
              {
                themes.map((theme)=>(
                  <motion.div
                  key={theme.name}
                  whileHover={{ scale:1.02, y: -2 }}
                  whileTap={{ scale:0.98 }}
                  >
                    <Button 
                    onClick={()=>{
                      onThemeSelect(theme)
                    }}
                    className={`flex flex-col items-center justify-start p-6 w-full h-auto rounded-xl relative overflow-hidden transition-all duration-300 ${
                        selectedTheme.name === theme.name ? 'ring-2 ring-offset-2' : 'hover:shadow-md'
                    }`}
                    style={{
                      fontFamily:theme.fontFamily,
                      color:theme.fontColor,
                      background:theme.gradientBackground || theme.backgroundColor,
                      borderColor: selectedTheme.name === theme.name ? theme.accentColor : `${theme.accentColor}20`,
                      ...(selectedTheme.name === theme.name ? { ringColor: theme.accentColor } : {})
                    }}
                    variant="outline"
                    >
                      {selectedTheme.name === theme.name && (
                        <div className="absolute top-4 right-4 opacity-80" style={{ color: theme.accentColor }}>
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      <div className='w-full flex items-center justify-between'>
                        <span className='text-xl font-bold'>{theme.name}</span>
                        <div className='w-4 h-4 rounded-full shadow-sm'
                        style={{ backgroundColor:theme.accentColor}}
                        />
                      </div>
                      <div className='space-y-1 w-full text-left mt-4'>
                        <div className='text-2xl font-bold' 
                        style={{
                          color:theme.accentColor
                        }}>Title</div>
                        <div className='text-base opacity-80 font-medium'>
                          Body & {' '}
                          <span className=''
                          style={{
                            color:theme.accentColor
                          }}>link</span>
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))
              }
            </div>
        </ScrollArea>
        <AgenticWorkflowDialog
          open={isGenerating}
          onOpenChange={() => {}}
          topic={project?.title || "Your Presentation"}
          steps={agentSteps}
          currentProgress={progress}
          currentAgentName={currentAgentName}
          currentAgentDescription={currentAgentDescription}
          runId={runId}
          stream={stream}
        />
      </div>
    )
}

export default ThemePicker;