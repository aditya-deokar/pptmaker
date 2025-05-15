'use client'
import { useRouter } from 'next/navigation'
import React from 'react'
import { AnimatePresence, motion } from "framer-motion"
import usePromptStore from '@/store/usePromptStore'
import CreatePage from './CreatePage'

const RenderPage = () => {

    const router= useRouter()
    const { page, setPage }= usePromptStore();
    const renderStep =()=>{
        switch(page){
            case "create":
                return <CreatePage />
            case "create-scratch":
                break
            case "creative-ai":
                break
            
            default:
                break
        }
    }

  return (
    <AnimatePresence mode='wait'>

            <motion.div 
                key={page}
                initial={
                    {
                        opacity:0,
                        x:20
                    }
                }
                animate={
                    { opacity:1 , x:0 }
                }
                exit={
                    { opacity:0 , x:-20 }
                }
                transition={
                    { duration: 0.3 }
                }
            
            >
                {renderStep()}
            </motion.div>
    </AnimatePresence>
  )
}

export default RenderPage