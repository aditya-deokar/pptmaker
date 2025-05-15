import React, { Suspense } from 'react'
import { redirect } from 'next/navigation'
import CreatePageSkeleton from './_components/CreatePageSkeleton'
import { onAuthenticateUser } from '@/actions/user'
import RenderPage from './_components/RenderPage'

const page = async() => {
 const checkUser = await onAuthenticateUser()
 
   if (!checkUser.user) {
     redirect('/sign-in')
   }
 
  //  if(!checkUser.user.subscription){
  //     redirect('/dashboard')
  //  }

  return (
    <main className="w-full h-full pt-6">
      <Suspense fallback={<CreatePageSkeleton />}>
        <RenderPage />
      </Suspense>
    </main>
  )
}

export default page