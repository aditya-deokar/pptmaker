import React from 'react'
import { ThemeSwitcher } from '../global/mode-toggle'
import Link from 'next/link'


const Navbar = () => {
    return (
        <header className="sticky top-0 z-[10] flex w-full items-center gap-2 backdrop-blur-lg p-4 justify-between hero-gradient">

            <span className="truncate text-vivid text-3xl font-semibold">
                <Link href={'/'}>Verto AI</Link>
            </span>
            <div className="flex items-center justify-between gap-4 flex-wrap">

                {/* Mode Toggle */}
                <ThemeSwitcher />

            </div>
        </header>
    )
}

export default Navbar