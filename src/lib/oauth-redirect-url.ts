const OAUTH_AUTHORIZE_PATH = '/oauth/authorize';

function firstQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function isAllowedOAuthRedirect(url: URL): boolean {
  if (url.pathname !== OAUTH_AUTHORIZE_PATH) {
    return false;
  }

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!configuredAppUrl) {
    return true;
  }

  try {
    const configured = new URL(configuredAppUrl);
    return url.origin === configured.origin;
  } catch {
    return true;
  }
}

export type OAuthRedirectSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function getOAuthRedirectUrlFromSearchParams(
  searchParams?: OAuthRedirectSearchParams | null
): string | null {
  const candidate =
    firstQueryValue(searchParams?.redirect_url)
    ?? firstQueryValue(searchParams?.redirect_url_complete);

  if (!candidate) {
    return null;
  }

  try {
    const url = candidate.startsWith('/')
      ? new URL(candidate, process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
      : new URL(candidate);

    if (!isAllowedOAuthRedirect(url)) {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
