'use client'
import { Button } from '@/components/ui/button'
import Home from '@/icons/Home'
import { Share } from '@/icons/Share'
import { useSlideStore } from '@/store/useSlideStore'
import { HomeIcon, Play } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'sonner'

type Props = {
    presentationId:string
}

const Navbar = ({ presentationId }: Props) => {

    const { currentTheme } =useSlideStore();
    const [isPresentationMode, setIsPresentationMode] = useState(false);

    const handleCopy= ()=>{
        navigator.clipboard.writeText(`${window.location.origin}/share/${presentationId}`)

        toast.success('Link Copied',
            {
                description:'The Link has been copied to your clipboard'
            }
        )
    }


  return (
    <nav className='fixed top-0 left-0 right-0 z-50 w-full h-20 flex justify-between items-center py-4 px-7 border-b'
    style={{
        backgroundColor:currentTheme.navbarColor || currentTheme.backgroundColor,
        color:currentTheme.accentColor,
    }}
    >
        <Link passHref href={'/dashboaed'}>
            <Button
             variant={'outline'}
             style={{
                backgroundColor:currentTheme.navbarColor || currentTheme.backgroundColor,
                // color:currentTheme.accentColor,
                }}
            >
                <Home />
                <span className='hidden sm:inline'>Return Home</span>

            </Button>
        </Link>

        <Link href={'/presentation/template-market'} 
        className='text-lg font-semibold hidden sm:block'>
            Presentation Title
        </Link>

        <div className='flex items-center gap-4'>
            <Button
             style={{
                backgroundColor:currentTheme.navbarColor || currentTheme.backgroundColor,
                // color:currentTheme.accentColor,
                }}
                variant={'outline'}
                onClick={handleCopy}
             >
                <Share/>
             </Button>
             {/* selling feature */}
             {/* <SellTemplate/> */}

             <Button variant={'default'} className='flex items-center gap-2'
             onClick={()=> setIsPresentationMode(true)}
             >
                <Play className='w-4 h-4'/>
                <span className='hidden sm:inline'>Present</span>
             </Button>
        </div>
                {/* add presentation */}
        {/* {isPresentationMode && <PresentationMode/> } */}
    </nav>
  )
}

export default Navbar