
import { onAuthenticateUser } from '@/actions/user'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = { children: React.ReactNode }

const Layout = async ({ children }: Props) => {
//   const recentProjects = await getRecentProjects()
  const checkUser = await onAuthenticateUser()

  if (!checkUser.user) {
    redirect('/sign-in')
  }

  return (
    <SidebarProvider>
      {/* <AppSidebar
        recentProjects={recentProjects.data || []}
        user={checkUser.user}
      /> */}
      <SidebarInset>
        {/* <UpperInfoBar user={checkUser.user} /> */}
        <div className="p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
