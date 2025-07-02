import { MasterRecursiveComponent } from '@/app/(protected)/presentation/[presentationId]/_components/editor/MasterRecursiveComponent'
import { Slide, Theme } from '@/lib/types'
import { cn } from '@/lib/utils'
import Image from 'next/image'


import React from 'react'

type Props={
    slide:Slide,
    theme:Theme,
}

const ThumnailPreview = ({ slide ,theme }: Props) => {
  return (
    <div className={cn(
        'w-full relative aspect-[16/9] rounded-lg overflow-hidden transition-all duration-200 p-2'
    )}
    style={{
        fontFamily:theme.fontFamily,
        color:theme.accentColor,
        backgroundColor:theme.slideBackgroundColor,
        backgroundImage:theme.gradientBackground,

    }}
    >
        {
            slide? (<div className='scale-[0.5] origin-top-left w-[200%] h-[200%] overflow-hidden'>
                <MasterRecursiveComponent
                    content={slide.content}
                    onContentChange={()=>{}}
                    isPreview={true}
                    slideId={slide.id}
                />
            </div>) : (
                <div className='w-full h-full bg-gray-400 flex justify-center items-center'>
                    <Image src={'/file.svg'} alt='image' width={30} height={30} />
                </div>
            )
        }
    </div>
  )
}

export default ThumnailPreview