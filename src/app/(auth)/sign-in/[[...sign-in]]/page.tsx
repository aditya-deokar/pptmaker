import { SignIn } from '@clerk/nextjs'
import {
  getOAuthRedirectUrlFromSearchParams,
  type OAuthRedirectSearchParams,
} from '@/lib/oauth-redirect-url'

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<OAuthRedirectSearchParams>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const oauthRedirectUrl = getOAuthRedirectUrlFromSearchParams(resolvedSearchParams)

  return (
    <SignIn
      forceRedirectUrl={oauthRedirectUrl ?? undefined}
      signUpForceRedirectUrl={oauthRedirectUrl ?? undefined}
    />
  )
}
