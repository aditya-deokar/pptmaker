'use client'
import { JsonValue } from '@/generated/prisma/runtime/library'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { itemVariants, themes } from '@/lib/constants'
import { useSlideStore } from '@/store/useSlideStore'
import { useRouter } from 'next/navigation'
import ThumnailPreview from './ThumnailPreview'
import { timeAgo } from '@/lib/utils'
import { AlertDialogBox } from '../alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { deleteProject, recoverProject } from '@/actions/projects'


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
  const router = useRouter();
  const [open, setOpen] = useState(false);

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

  return (
    <motion.div
    className={`group w-full flex-col flex gap-y-3 rounded-xl p-3 transition-colors ${!isDeleted && 'hover:bg-muted/50'}`}
    variants={itemVariants}
    >
        <div className='relative aspect-[16/10] overflow-hidden rounded-lg cursor-pointer'
        onClick={HandleNavigation}>
            <ThumnailPreview 
            theme={theme} 
            // slide={JSON.parse(JSON.stringify(slideData))?.[0]}
              />
        </div>

        <div className='w-full'>
            <div className='space-y-1 '>
                <h3 className='font-semibold text-base text-primary line-clamp-1'>{title}</h3>
                <div className='flex w-full justify-between items-center gap-2'>
                    <p className='text-sm text-muted-foreground' suppressHydrationWarning>
                        {timeAgo(createdAt)}
                    </p>

                     { isDelete ? (
              <AlertDialogBox
                description="This will recover your project and restore your data."
                className="bg-green-500 text-white dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700"
                onClick={handleRecover}
                loading={loading}
                open={open}
                handleOpen={() => setOpen(!open)}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-background-80 dark:hover:bg-background-90"
                  disabled={loading}
                >
                  Recover
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
                  size="sm"
                  variant="ghost"
                  className="bg-background-80 dark:hover:bg-background-90"
                  disabled={loading}
                >
                  Delete
                </Button>
              </AlertDialogBox>
            )}
                </div>
            </div>
        </div>
    </motion.div>
  )
}

export default ProjectCard