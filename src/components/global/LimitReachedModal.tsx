'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crown, Key, Zap, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface LimitReachedModalProps {
  isOpen: boolean
  onClose: () => void
  usage: number
  limit: number
}

export function LimitReachedModal({ isOpen, onClose, usage, limit }: LimitReachedModalProps) {
  // BYOK is an option if they are still on the first tier (5 projects)
  const isByokAvailable = limit <= 5

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogHeader className="space-y-3 pt-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Project Limit Reached
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            You've used all <strong>{limit}</strong> of your project generations.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          {isByokAvailable && (
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-vivid/20 bg-vivid/5 relative overflow-hidden group transition-all hover:bg-vivid/10">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Key className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-2 text-vivid font-semibold">
                <Zap className="w-4 h-4 fill-vivid" />
                <span>Power User Option</span>
              </div>
              <p className="text-sm text-muted-foreground pr-8 leading-relaxed">
                Add your own API key (Google, OpenAI, or Groq) to unlock <strong>10 additional projects</strong> for presentation and mobile design generation.
              </p>
              <Link href="/settings" onClick={onClose} className="w-full">
                <Button variant="outline" className="w-full border-vivid/30 hover:bg-vivid/10 text-vivid mt-2 font-semibold">
                  Add My API Key
                </Button>
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 relative overflow-hidden group transition-all hover:bg-amber-500/10">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Crown className="w-12 h-12" />
            </div>
            <div className="flex items-center gap-2 text-amber-500 font-semibold">
              <Crown className="w-4 h-4 fill-amber-500" />
              <span>Pro Subscription</span>
            </div>
            <p className="text-sm text-muted-foreground pr-8 leading-relaxed">
              Unlock <strong>unlimited project generations</strong>, premium templates, and advanced AI editing tools.
            </p>
            <Link href="/settings" onClick={onClose} className="w-full">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold mt-2 shadow-lg shadow-amber-500/20">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex justify-center pb-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            I'll do it later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
