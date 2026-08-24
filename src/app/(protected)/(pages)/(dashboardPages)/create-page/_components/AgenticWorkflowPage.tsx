'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Sparkles, Loader2, Wand2, Brain, FileText, Palette, 
  Search, ImagePlus, Package, Database, Zap, Lightbulb, 
  CheckCircle2, Check, ChevronDown, ChevronUp, Target, ChevronLeft, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAgenticGenerationV2 } from '@/hooks/useAgenticGenerationV2'
import AgenticWorkflowDialog from '@/components/global/agentic-workflow/AgenticWorkflowDialog'
import { useSlideStore } from '@/store/useSlideStore'
import { containerVariants, itemVariants, themes } from '@/lib/constants'
import { Theme } from '@/lib/types'
import { useUsageLimit } from '@/hooks/use-usage-limit'

type Props = {
  onBack: () => void
}

const AGENT_INFO = [
  { icon: Target, name: 'Setup', description: 'Environment setup', color: 'text-indigo-500' },
  { icon: Brain, name: 'Logic', description: 'Architecture design', color: 'text-blue-500' },
  { icon: FileText, name: 'Content', description: 'Content synthesis', color: 'text-sky-500' },
  { icon: Palette, name: 'Design', description: 'Visual systems', color: 'text-violet-500' },
  { icon: Search, name: 'Research', description: 'Asset discovery', color: 'text-emerald-500' },
  { icon: ImagePlus, name: 'Visuals', description: 'Media curation', color: 'text-amber-500' },
  { icon: Package, name: 'Build', description: 'Component assembly', color: 'text-orange-500' },
  { icon: Database, name: 'Deploy', description: 'Final persistence', color: 'text-rose-500' }
]

const ThemeCard = ({ theme, isSelected, onSelect, isGenerating }: { 
  theme: Theme, 
  isSelected: boolean, 
  onSelect: (t: Theme) => void,
  isGenerating: boolean 
}) => (
  <motion.button
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onSelect(theme)}
    disabled={isGenerating}
    className={`relative shrink-0 w-28 h-28 rounded-2xl overflow-hidden border transition-all duration-500 group/card ${
      isSelected 
        ? 'border-foreground ring-4 ring-foreground/5 z-20 shadow-lg' 
        : 'border-border/30 hover:border-border/60 bg-muted/5'
    }`}
  >
    <div className="absolute inset-0 flex flex-col p-2.5" style={{ background: theme.backgroundColor }}>
      <div className="relative w-full h-[40%] rounded-lg mb-2 overflow-hidden border border-white/5" style={{ background: theme.slideBackgroundColor }}>
         <div className="absolute top-1 left-1 w-1/3 h-1 rounded-full opacity-10" style={{ background: theme.fontColor }} />
         <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full opacity-20" style={{ background: theme.accentColor }} />
      </div>
      <div className="mt-auto flex flex-col gap-0.5 text-left">
        <p className="text-[9px] font-bold tracking-tight opacity-40 uppercase" style={{ color: theme.fontColor }}>{theme.type}</p>
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-medium truncate max-w-[50px]" style={{ color: theme.fontColor }}>{theme.name}</p>
          {isSelected && <div className="w-2 h-2 rounded-full bg-foreground shadow-sm animate-pulse" />}
        </div>
      </div>
    </div>
  </motion.button>
);

const ThemeMarquee = ({ themes, selectedTheme, onSelect, isGenerating, direction = 'left' }: {
  themes: Theme[],
  selectedTheme: Theme,
  onSelect: (t: Theme) => void,
  isGenerating: boolean,
  direction?: 'left' | 'right'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const duplicatedThemes = useMemo(() => [...themes, ...themes], [themes]);

  return (
    <div 
      className="relative w-full group/marquee overflow-hidden py-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex overflow-hidden px-4">
        <motion.div
          className="flex gap-3 shrink-0"
          animate={{ x: isHovered ? undefined : (direction === 'left' ? ["0%", "-50%"] : ["-50%", "0%"]) }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        >
          {duplicatedThemes.map((theme, i) => (
            <ThemeCard 
              key={`${theme.name}-${i}`} 
              theme={theme} 
              isSelected={selectedTheme.name === theme.name}
              onSelect={onSelect}
              isGenerating={isGenerating}
            />
          ))}
        </motion.div>
      </div>
      <div className="absolute inset-y-0 left-0 w-16 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />
    </div>
  );
};

const AgenticWorkflowPage = ({ onBack }: Props) => {
  const router = useRouter()
  const { setSlides, setProject } = useSlideStore()
  const [presentationTitle, setPresentationTitle] = useState('')
  const [presentationTopic, setPresentationTopic] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themes[0])
  const [showContext, setShowContext] = useState(false)
  const { checkUsage, UsageModal } = useUsageLimit()

  const {
    generate,
    isGenerating,
    progress,
    currentAgentName,
    currentAgentDescription,
    error,
    agentSteps,
    runId,
    stream
  } = useAgenticGenerationV2()

  const row1 = useMemo(() => themes.slice(0, 10), []);
  const row2 = useMemo(() => themes.slice(10, 20), []);

  const handleGenerate = async () => {
    if (!presentationTitle.trim() || !presentationTopic.trim()) {
      toast.error("Required fields are missing")
      return
    }

    const canGenerate = await checkUsage();
    if (!canGenerate) return;

    try {
      const fullTopic = `${presentationTitle}: ${presentationTopic}`
      await generate(fullTopic, additionalContext, selectedTheme.name)
    } catch (error) {
      toast.error("Generation failed")
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen flex flex-col items-center pt-12 pb-20 px-6 max-w-7xl mx-auto space-y-16"
    >
      {/* Editorial Header */}
      <motion.div variants={itemVariants} className="w-full flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isGenerating}
          className="gap-2 text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 rounded-full px-5 h-9 text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-3 h-3" />
          Dashboard
        </Button>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
          <Database className="w-3 h-3" />
          Verto Agentic Protocol v2.4
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full grid lg:grid-cols-12 gap-20">
        {/* Input Column */}
        <div className="lg:col-span-7 space-y-16">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Configure <span className="text-muted-foreground">Synthesis.</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Define your parameters. Our orchestration layer will handle the heavy lifting of research, content architecture, and visual design.
            </p>
          </div>

          <div className="space-y-12">
            {/* Title & Topic Inputs */}
            <div className="grid gap-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Project Designation</label>
                <div className="relative">
                  <Input
                    placeholder="Enter project name..."
                    value={presentationTitle}
                    onChange={(e) => setPresentationTitle(e.target.value)}
                    disabled={isGenerating}
                    className="text-lg font-medium tracking-tight h-auto py-1 bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground/20 px-0"
                  />
                  <div className="h-px w-full bg-border/40 relative mt-1 overflow-hidden">
                     <motion.div className="absolute inset-y-0 left-0 bg-foreground" animate={{ width: presentationTitle ? '100%' : '2%' }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Research Core</label>
                <div className="relative">
                  <Input
                    placeholder="Specify main topic..."
                    value={presentationTopic}
                    onChange={(e) => setPresentationTopic(e.target.value)}
                    disabled={isGenerating}
                    className="text-lg font-medium tracking-tight h-auto py-1 bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground/20 px-0"
                  />
                  <div className="h-px w-full bg-border/40 relative mt-1 overflow-hidden">
                     <motion.div className="absolute inset-y-0 left-0 bg-foreground" animate={{ width: presentationTopic ? '100%' : '2%' }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Toggle */}
            <div className="pt-2">
              <button
                onClick={() => setShowContext(!showContext)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                {showContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Advanced Requirements
              </button>
              
              <AnimatePresence>
                {showContext && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6"
                  >
                    <Textarea
                      placeholder="Enter specific constraints, audience demographics, or stylistic guidelines..."
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      disabled={isGenerating}
                      rows={3}
                      className="text-sm bg-muted/5 border-border/20 focus:border-foreground/20 rounded-2xl p-5 transition-all resize-none font-medium"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Themes */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Design DNA</label>
                <div className="text-[10px] font-black bg-foreground text-background px-2 py-0.5 rounded uppercase tracking-tighter">
                  {selectedTheme.name}
                </div>
              </div>
              <div className="space-y-0 border-y border-border/10 py-2">
                <ThemeMarquee themes={row1} selectedTheme={selectedTheme} onSelect={setSelectedTheme} isGenerating={isGenerating} direction="left" />
                <ThemeMarquee themes={row2} selectedTheme={selectedTheme} onSelect={setSelectedTheme} isGenerating={isGenerating} direction="right" />
              </div>
            </div>

            <div className="pt-6">
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-14 text-sm font-bold rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 group relative overflow-hidden"
              >
                <span className="relative flex items-center justify-center gap-3">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Executing... {Math.round(progress)}%
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      Initiate Generation
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Process Column */}
        <div className="lg:col-span-5">
          <div className="bg-muted/5 border border-border/30 rounded-[2.5rem] p-10 space-y-10 sticky top-12">
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold tracking-tight">Agentic Pipeline</h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Autonomous Workflow Execution</p>
            </div>

            <div className="space-y-1 relative">
              <div className="absolute left-6 top-6 bottom-6 w-px bg-border/20" />
              
              {AGENT_INFO.map((agent, index) => (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-5 p-3 rounded-2xl hover:bg-muted/10 transition-colors group"
                >
                  <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center bg-background border border-border/20 shadow-xs transition-all duration-300 group-hover:border-foreground/20`}>
                    <agent.icon className={`w-4 h-4 stroke-[1.5] ${agent.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold tracking-tight">{agent.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">{agent.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-6 rounded-3xl bg-muted/5 border border-border/20 flex gap-4 items-start">
               <Lightbulb className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
               <p className="text-[10px] text-muted-foreground leading-relaxed font-medium uppercase tracking-wider">
                 Our agents perform deep-web research to ensure all content is factually accurate and contextually relevant.
               </p>
            </div>
          </div>
        </div>
      </motion.div>

      <AgenticWorkflowDialog
        open={isGenerating}
        onOpenChange={() => { }}
        topic={presentationTitle || "Synthesis"}
        steps={agentSteps}
        currentProgress={progress}
        currentAgentName={currentAgentName}
        currentAgentDescription={currentAgentDescription}
        runId={runId}
        stream={stream}
        onComplete={() => { }}
      />
      <UsageModal />
    </motion.div>
  )
}

export default AgenticWorkflowPage
