'use client'

import { ScrollArea } from '@/components/ui/scroll-area';
import { useSlideStore } from '@/store/useSlideStore';
import React from 'react'

const LayoutChooser = () => {

    const { currentTheme }=useSlideStore();
  return (
    <ScrollArea
    className='h-[400px]'
    style={{
        backgroundColor: currentTheme.slideBackgroundColor,
    }}
    >
        <div className='p-4'></div>
    </ScrollArea>
  )
}

export default LayoutChooser