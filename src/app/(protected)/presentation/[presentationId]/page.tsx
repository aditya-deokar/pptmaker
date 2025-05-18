'use client'

import { getProjectById } from '@/actions/projects'
import { themes } from '@/lib/constants'
import { useSlideStore } from '@/store/useSlideStore'
import { Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { redirect, useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DndProvider } from 'react-dnd'

type Props = {}

const page = (props: Props) => {


    const{ currentTheme, setCurrentTheme, setProject, setSlides }=useSlideStore();
    const params = useParams();
    const { setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
      (async()=>{

        try {
            const res = await getProjectById(params.presentationId as string);

            if(res?.status !==200 || !res.data){
                toast.error('Error',{
                    description: "Failed to Fetch project",
                });
                redirect('/dashboard');
            }

            const findTheme = themes.find( (theme)=>theme.name === res.data.themeName )
            setCurrentTheme(findTheme || themes[0]);
            setTheme(findTheme?.type === "dark" ? 'dark' : 'light');

            setProject(res.data);

            setSlides(JSON.parse(JSON.stringify(res.data.slides)))

        } catch (error) {
             toast.error('Error',{
                    description: "An Unexpected Error Occured",
                });
        } finally{
            setIsLoading(false);
        }


      })()
    
      
    }, [])


    if(isLoading ){
       return (
         <div className='flex items-center justify-center h-screen '>
            <Loader2 className='w-8 h-8 animate-spin text-primary'/>
        </div>
       )
    }
    
  return (
    <DndProvider >
        
    </DndProvider>
  )
}

export default page