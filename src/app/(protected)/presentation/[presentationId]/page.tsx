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
import { HTML5Backend } from 'react-dnd-html5-backend'
import Navbar from './_components/Navbar'
import LayoutPreview from './_components/editor-sidebar/leftsidebar/LayoutPreview'
import Editor from './_components/editor/Editor'

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
    <DndProvider backend={HTML5Backend}>

      <div className='flex flex-col min-h-screen'>
        <Navbar presentationId={params.presentationId as string}/>
        <div className='flex-1 flex overflow-hidden pt-16'
        style={{
                backgroundColor:currentTheme.backgroundColor,
                color:currentTheme.accentColor,
                fontFamily:currentTheme.fontFamily,
                }}
          >
            <LayoutPreview />

            <div className="flex-1 ml-64 pr-16">
              <Editor isEditable={true} />
            </div>

        </div>
      </div>
        
    </DndProvider>
  )
}

export default page