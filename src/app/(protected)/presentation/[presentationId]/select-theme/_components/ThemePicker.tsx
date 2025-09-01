// /components/ThemePicker.tsx

'use client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Theme } from '@/lib/types'
import { useSlideStore } from '@/store/useSlideStore'
import { Loader2, Wand2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { generateLayouts } from '@/actions/genai'
import { generatePresentationGraph } from '@/agentic-workflow/actions/genai-graph'

type Props = {
    selectedTheme:Theme
    themes:Theme[]
    onThemeSelect: (theme:Theme)=> void
}

const ThemePicker = ({onThemeSelect, selectedTheme, themes}: Props) => {
    const router = useRouter();
    const params = useParams();
    const { project, setSlides, currentTheme } = useSlideStore();
    const [loading, setLoading] = useState(false);

    const handleGenerateLayouts = async () => {
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

        try {
            // const res = await generateLayouts(
            //     params.presentationId as string,
            //     currentTheme.name
            // );
            const res = await generatePresentationGraph(" intro to Langgraph ");
            
            // --- FIX: Check if the response and nested data exist before processing ---
            if (!res || res.status !== 200 || !res.data || !res.data) {
                throw new Error(res.error || "Failed to generate layouts");
            }

            toast.success("Success", {
                description: "Generated Successfully",
            });

            // --- FIX: Extract the actual array of slides from the nested response object ---
            const slidesArray = res.data.data;

            setSlides(slidesArray);
            router.push(`/presentation/${project.id}`);

        } catch (err: any)  {
            toast.error("Error", {
                description: err.message || "Failed to generate layouts",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
      <div
        className='w-[400px] overflow-hidden sticky top-0 h-screen flex flex-col'
        style={{
          backgroundColor:selectedTheme.sidebarColor || selectedTheme.backgroundColor,
          borderLeft:`1px solid ${selectedTheme.accentColor}20`,
        }}
      >
        <div className='p-8 space-y-6 flex-shrink-0'>
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
            className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 "
            style={{
              backgroundColor: selectedTheme.accentColor,
              color: selectedTheme.backgroundColor,
            }}
            onClick={handleGenerateLayouts}
            disabled={loading} // --- UX IMPROVEMENT: Disable button while loading ---
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5" />
            )}
            {loading ? "Generating..." : "Generate Presentation"}
          </Button>
        </div>
        <ScrollArea className='flex-grow px-8 pb-8 '>
            <div className='grid grid-cols-1 gap-4 px-2'>
              {
                themes.map((theme)=>(
                  <motion.div
                  key={theme.name}
                  whileHover={{ scale:1.02 }}
                  whileTap={{ scale:0.98 }}
                  >
                    <Button 
                    onClick={()=>{
                      onThemeSelect(theme)
                    }}
                    className='flex flex-col items-center justify-start p-6 w-full h-auto'
                    style={{
                      fontFamily:theme.fontFamily,
                      color:theme.fontColor,
                      background:theme.gradientBackground || theme.backgroundColor,
                    }}
                    >
                      <div className='w-full flex items-center justify-between'>
                        <span className='text-xl font-bold'>{theme.name}</span>
                        <div className='w-3 h-3 rounded-full'
                        style={{ backgroundColor:theme.accentColor}}
                        />
                      </div>
                      <div className='space-y-1 w-full'>
                        <div className='text-2xl font-bold' 
                        style={{
                          color:theme.accentColor
                        }}>Title</div>
                        <div className='text-base opacity-80'>
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
      </div>
    )
}

export default ThemePicker;