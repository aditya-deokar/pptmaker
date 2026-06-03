'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from '@/icons/Plus';
import { Presentation, Smartphone, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import type { AuthenticatedAppUser } from '@/lib/user-compat';

function NewProjectButton({ user }: { user: AuthenticatedAppUser }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="lg"
          variant="default"
          className="rounded-lg font-semibold"
        >
          <Plus />
          New Project
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => router.push('/create-page')}
          className="cursor-pointer py-3"
        >
          <Presentation className="h-4 w-4 mr-3 text-primary" />
          <div className="flex flex-col">
            <span className="font-medium">Presentation</span>
            <span className="text-xs text-muted-foreground">AI-powered slide deck</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push('/mobile-designs/create')}
          className="cursor-pointer py-3"
        >
          <Smartphone className="h-4 w-4 mr-3 text-violet-600" />
          <div className="flex flex-col">
            <span className="font-medium">Mobile Design</span>
            <span className="text-xs text-muted-foreground">App interface mockup</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NewProjectButton;
