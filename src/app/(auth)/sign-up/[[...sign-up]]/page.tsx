import { SignUp } from '@clerk/nextjs'
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
    <SignUp
      forceRedirectUrl={oauthRedirectUrl ?? undefined}
      signInForceRedirectUrl={oauthRedirectUrl ?? undefined}
    />
  )
}
