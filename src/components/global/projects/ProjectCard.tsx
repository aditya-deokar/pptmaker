'use client'
import { JsonValue } from '@/generated/prisma/runtime/library'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { itemVariants, themes } from '@/lib/constants'
import { useSlideStore } from '@/store/useSlideStore'
import { useRouter } from 'next/navigation'

import { timeAgo } from '@/lib/utils'
import { AlertDialogBox } from '../alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { deleteProject, recoverProject } from '@/actions/projects'
import ThumnailPreview from './ThumnailPreview'
import Link from 'next/link'
import { useLayoutStore } from '@/store/useLayoutStore'
import { cn } from '@/lib/utils'
import { Trash2, RefreshCcw } from 'lucide-react'


type Props = {
  projectId: string;
  title: string;
  createdAt: string;
  themeName: string;
  isDelete?: boolean;
  slideData: JsonValue;
};

const ProjectCard = ({
  projectId,
  title,
  createdAt,
  themeName,
  isDelete = false,
  slideData,
}: Props) => {

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { setSlides } = useSlideStore();
  const { layout } = useLayoutStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isList = layout === 'list';
  const isShowcase = layout === 'showcase';

  const theme = themes.find((theme) => theme.name === themeName) || themes[0];

  const handleDelete = async () => {
    setLoading(true);
    if (!projectId) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Project not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await deleteProject(projectId);
      if (res.status !== 200) {
        throw new Error("Failed to delete project");
      }
      router.refresh();
      setOpen(false);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    setLoading(true);
    if (!projectId) {
      setLoading(false);
      toast({
        title: "Error",
        description: "Project not found",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await recoverProject(projectId);
      if (res.status !== 200) {
        throw new Error("Failed to recover project");
      }
      setOpen(false);
      router.refresh();
      toast({
        title: "Success",
        description: "Project recovered successfully",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const HandleNavigation = () => {
    console.log(slideData);
    setSlides(JSON.parse(JSON.stringify(slideData)));
    router.push(`/presentation/${projectId}`);
  };

  const onCardClick = () => {
    setSlides(JSON.parse(JSON.stringify(slideData)));
  };

  return (
    <Link href={`/presentation/${projectId}`} onClick={onCardClick} className="block w-full h-full group z-0">
      <motion.div
        layout
        transition={{ layout: { duration: 0.4, ease: "easeOut" } }}
        style={{ borderRadius: 32 }}
        className={cn(
          "w-full p-4 relative overflow-hidden border border-black/[0.03] dark:border-white/[0.05] bg-white/80 dark:bg-black/40 backdrop-blur-xl hover:border-primary/10 dark:hover:border-primary/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.01)] dark:hover:shadow-[0_8px_40px_rgba(255,255,255,0.03)] hover:-translate-y-1 z-0 transition-transform duration-500 ease-out group-hover:bg-white dark:group-hover:bg-black/50",
          isList ? "flex flex-row items-center gap-4" : "flex flex-col gap-y-3",
          isShowcase && "p-5 gap-y-4"
        )}
        variants={itemVariants}
      >
      {/* Apple-style Inner Highlight */}
      <div className="absolute inset-0 rounded-[32px] ring-1 ring-inset ring-black/5 dark:ring-white/5 pointer-events-none" />

      {/* Hover Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none rounded-[32px]" />

      <motion.div layout="position" transition={{ layout: { duration: 0.4, ease: "easeOut" } }} className={cn('relative overflow-hidden rounded-2xl z-10 bg-muted/20 border border-black/5 dark:border-white/5',
        isList ? "w-32 sm:w-64 aspect-video shrink-0" : "w-full aspect-video"
      )}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none" />
        <ThumnailPreview
          theme={theme}
          slide={JSON.parse(JSON.stringify(slideData))?.[0]}
        />
      </motion.div>

      <motion.div layout="position" transition={{ layout: { duration: 0.4, ease: "easeOut" } }} className={cn('z-10 px-2 pb-2 flex-1', isList ? "py-2" : "w-full")}>
        <div className='flex flex-col justify-between h-full'>
          <h3 className={cn('font-semibold text-foreground/90 line-clamp-1 mb-2', isList ? "text-xl" : "text-lg")}>{title}</h3>
          <div className='flex w-full justify-between items-center gap-2 mt-auto'>
            <p className='text-sm text-muted-foreground/80 font-medium' suppressHydrationWarning>
              {timeAgo(createdAt)}
            </p>

            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="z-20">
              {isDelete ? (
              <AlertDialogBox
                description="This will recover your project and restore your data."
                className="bg-green-500 text-white dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700"
                onClick={handleRecover}
                loading={loading}
                open={open}
                handleOpen={() => setOpen(!open)}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-50 group-hover:opacity-100 transition-opacity hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-500 rounded-full h-8 w-8"
                  disabled={loading}
                >
                  <RefreshCcw className="w-4 h-4" />
                </Button>
              </AlertDialogBox>
            ) : (
              <AlertDialogBox
                description="This will delete your project and send to trash."
                className="bg-red-500 text-white dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700"
                onClick={handleDelete}
                loading={loading}
                open={open}
                handleOpen={() => setOpen(!open)}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-50 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-500 rounded-full h-8 w-8"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogBox>
            )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
    </Link>
  )
}

export default ProjectCard