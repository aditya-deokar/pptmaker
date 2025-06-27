'use Client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LayoutTemplate } from 'lucide-react'

import React from 'react'
import LayoutChooser from './tabs/LayoutChooser'
import { Button } from '@/components/ui/button'




type Props = {

}


const EditorSlidebar = ({ }: Props) => {

    
    return (
        <div className='fixed top-1/2 right-0 transform -translate-y-1/2 z-10 '>
            <div className='rounded-xl border-r-0 border border-background-70 shadow-lg p-2 flex flex-col items-center space-y-4'>
                <Popover>
                    <PopoverTrigger asChild>
                        <>
                        <Button variant={'ghost'}
                            size={'icon'}
                            className='h-10 w-10 rounded-full'
                        >
                            <LayoutTemplate className='h-5 w-5' />
                            <span className='sr-only'>Choose Layout</span>
                        </Button>

                        <PopoverContent side='left' align='center' className='w-[400px] p-0'>
                            <LayoutChooser />
                        </PopoverContent>
                        
                        </>
                    </PopoverTrigger>
                </Popover>
            </div>
        </div>
    )
}

export default EditorSlidebar