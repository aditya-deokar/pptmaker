'use client'
import { Button } from '@/components/ui/button'
import { containerVariants, CreatePageCard, itemVariants } from '@/lib/constants'
import usePromptStore from '@/store/usePromptStore'
import { motion } from 'framer-motion'
import React, { useEffect } from 'react'
import RecentPrompts from './RecentPrompts'
import { ShineBorder } from '@/components/global/ui/shine-border'


type Props ={
    onSelectOption: ( option:string )=> void
}
const CreatePage = ({ onSelectOption }:Props) => {

    const { prompts, setPage }= usePromptStore();

    useEffect(()=>{
        setPage('create')
    },[])
  return (
    <motion.div
    initial='hidden'
    animate='visible'
    className='space-y-8'
    variants={containerVariants} >

        <motion.div variants={itemVariants} className='text-center space-y-2'>
            <h1 className='text-4xl font-bold text-primary'>
                How would you to get Started
            </h1>
            <p className='text-secondary'>
                Choose your preferred method to begin
            </p>
        </motion.div>

        <motion.div variants={containerVariants} className="grid gap-6 md:grid-cols-3 p-4">
            {CreatePageCard.map((option)=>(
                <motion.div
                    key={option.type}
                    variants={itemVariants}
                    whileHover={{
                        scale: 1.02,
                        // rotate: 1,
                        transition: { duration: 0.01 },
                    }}
                    className={`${option.highlight
                            ? "bg-vivid-gradient"
                            : "hover:bg-vivid-gradient border"
                        } rounded-xl p-[1px] transition-all duration-300 ease-in-out`}
                >
                    <ShineBorder>
                        <motion.div
                        className={`${option.highlight
                            && "dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-red-900/20 overflow-hidden"
                        } w-full p-4 flex flex-col gap-y-6 items-start bg-background rounded-xl`}
                        whileHover={{
                            transition: { duration: 0.01 },
                        }}
                    >
                        <div className="flex flex-col items-start w-full gap-y-3">
                            <div>
                                <p className="text-primary text-lg font-semibold">
                                    {option.title}
                                </p>
                                <p
                                    className={`${option.highlight ? "text-vivid" : "text-primary"
                                        } text-4xl font-bold`}
                                >
                                    {option.highlightedText}
                                </p>
                            </div>
                            <p className="text-secondary text-sm font-normal">
                                {option.description}
                            </p>
                        </div>
                        <motion.div
                            className="self-end"
                            whileHover={{ scale: 1.05 }
                         
                        }
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                variant={option.highlight ? "default" : "outline"}
                                className="w-fit rounded-lg font-bold"
                                size={"sm"}
                                onClick={() => onSelectOption(option.type)}
                            >
                                {option.highlight ? "Generate" : "Continue"}
                            </Button>
                        </motion.div>
                    </motion.div>
                    </ShineBorder>
                </motion.div>
            ))}
        </motion.div>

        {prompts.length >0 && <RecentPrompts/>}


    </motion.div>
  )
}

export default CreatePage