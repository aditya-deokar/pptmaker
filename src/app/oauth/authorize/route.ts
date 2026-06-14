import { validateOAuthClient } from '@/mcp/auth/oauth-clients';
import {
  getMcpResourceUrl,
  isExpectedMcpResource,
} from '@/mcp/auth/oauth-config';
import { issueAuthorizationCode } from '@/mcp/auth/oauth-tokens';
import { resolveCurrentOAuthUser } from '@/mcp/auth/oauth-users';
import { parseRequestedScopes, scopeString } from '@/mcp/auth/scopes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface AuthorizationParams {
  responseType: string | null;
  clientId: string | null;
  redirectUri: string | null;
  scope: string | null;
  state: string | null;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;
  resource: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function paramsFromSearch(searchParams: URLSearchParams): AuthorizationParams {
  return {
    responseType: searchParams.get('response_type'),
    clientId: searchParams.get('client_id'),
    redirectUri: searchParams.get('redirect_uri'),
    scope: searchParams.get('scope'),
    state: searchParams.get('state'),
    codeChallenge: searchParams.get('code_challenge'),
    codeChallengeMethod: searchParams.get('code_challenge_method'),
    resource: searchParams.get('resource'),
  };
}

function paramsFromFormData(formData: FormData): AuthorizationParams {
  const get = (name: string) => {
    const value = formData.get(name);
    return typeof value === 'string' ? value : null;
  };

  return {
    responseType: get('response_type'),
    clientId: get('client_id'),
    redirectUri: get('redirect_uri'),
    scope: get('scope'),
    state: get('state'),
    codeChallenge: get('code_challenge'),
    codeChallengeMethod: get('code_challenge_method'),
    resource: get('resource'),
  };
}

function badRequest(message: string): Response {
  return Response.json(
    {
      error: 'invalid_request',
      error_description: message,
    },
    { status: 400 }
  );
}

function redirectWithOAuthError(
  redirectUri: string,
  error: string,
  description: string,
  state?: string | null
): Response {
  const url = new URL(redirectUri);
  url.searchParams.set('error', error);
  url.searchParams.set('error_description', description);
  if (state) {
    url.searchParams.set('state', state);
  }

  return Response.redirect(url);
}

function redirectToSignIn(request: Request): Response {
  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('redirect_url', request.url);
  return Response.redirect(signInUrl);
}

async function validateAuthorizationParams(
  request: Request,
  params: AuthorizationParams
) {
  if (!params.clientId || !params.redirectUri) {
    return { errorResponse: badRequest('client_id and redirect_uri are required.') };
  }

  const client = await validateOAuthClient(params.clientId, params.redirectUri);
  if (!client) {
    return {
      errorResponse: badRequest(
        'Unknown OAuth client or redirect_uri. Use CIMD, DCR, or OAUTH_ALLOWED_CLIENTS.'
      ),
    };
  }

  if (params.responseType !== 'code') {
    return {
      errorResponse: redirectWithOAuthError(
        params.redirectUri,
        'unsupported_response_type',
        'Verto AI supports only response_type=code.',
        params.state
      ),
    };
  }

  if (!params.codeChallenge || params.codeChallengeMethod !== 'S256') {
    return {
      errorResponse: redirectWithOAuthError(
        params.redirectUri,
        'invalid_request',
        'PKCE with code_challenge_method=S256 is required.',
        params.state
      ),
    };
  }

  if (!isExpectedMcpResource(params.resource, request.url)) {
    return {
      errorResponse: redirectWithOAuthError(
        params.redirectUri,
        'invalid_target',
        `resource must be ${getMcpResourceUrl(request.url)}.`,
        params.state
      ),
    };
  }

  const requestedScopes = parseRequestedScopes(params.scope);
  if (requestedScopes.invalidScopes.length > 0) {
    return {
      errorResponse: redirectWithOAuthError(
        params.redirectUri,
        'invalid_scope',
        `Unsupported scope: ${requestedScopes.invalidScopes.join(' ')}`,
        params.state
      ),
    };
  }

  return {
    client,
    scopes: requestedScopes.scopes,
  };
}

function consentPage(
  request: Request,
  params: AuthorizationParams,
  clientName: string,
  userEmail: string,
  scopes: readonly string[]
): Response {
  const scopeRows = scopes
    .map((scope) => `<li><code>${escapeHtml(scope)}</code></li>`)
    .join('');

  const hiddenInputs = [
    ['response_type', params.responseType ?? ''],
    ['client_id', params.clientId ?? ''],
    ['redirect_uri', params.redirectUri ?? ''],
    ['scope', scopeString(scopes)],
    ['state', params.state ?? ''],
    ['code_challenge', params.codeChallenge ?? ''],
    ['code_challenge_method', params.codeChallengeMethod ?? ''],
    ['resource', params.resource ?? ''],
  ]
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Connect Verto AI</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #09090b; color: #f4f4f5; }
    main { width: min(92vw, 460px); border: 1px solid #27272a; border-radius: 8px; background: #111113; padding: 28px; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
    h1 { margin: 0 0 10px; font-size: 24px; line-height: 1.2; letter-spacing: 0; }
    p { margin: 0 0 18px; color: #d4d4d8; line-height: 1.5; }
    ul { margin: 0 0 24px; padding-left: 20px; color: #d4d4d8; }
    li { margin: 8px 0; }
    code { color: #a7f3d0; }
    .meta { margin-bottom: 18px; padding: 12px; border: 1px solid #27272a; border-radius: 8px; background: #18181b; font-size: 14px; color: #d4d4d8; }
    .actions { display: flex; gap: 12px; }
    button { appearance: none; border: 0; border-radius: 6px; padding: 10px 14px; font-weight: 650; cursor: pointer; }
    .allow { background: #f4f4f5; color: #09090b; }
    .deny { background: transparent; color: #f4f4f5; border: 1px solid #3f3f46; }
  </style>
</head>
<body>
  <main>
    <h1>Connect Verto AI</h1>
    <p><strong>${escapeHtml(clientName)}</strong> wants permission to use Verto AI from chat.</p>
    <div class="meta">Signed in as ${escapeHtml(userEmail)}</div>
    <p>This connection can use these Verto permissions:</p>
    <ul>${scopeRows}</ul>
    <form method="post" action="${escapeHtml(new URL('/oauth/authorize', request.url).toString())}">
      ${hiddenInputs}
      <div class="actions">
        <button class="allow" type="submit" name="decision" value="allow">Allow</button>
        <button class="deny" type="submit" name="decision" value="deny">Cancel</button>
      </div>
    </form>
  </main>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const params = paramsFromSearch(new URL(request.url).searchParams);
  const validation = await validateAuthorizationParams(request, params);
  if ('errorResponse' in validation) {
    return validation.errorResponse;
  }

  const user = await resolveCurrentOAuthUser();
  if (!user) {
    return redirectToSignIn(request);
  }

  return consentPage(
    request,
    params,
    validation.client.clientName || validation.client.clientId,
    user.email,
    validation.scopes
  );
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const decision = formData.get('decision');
  const params = paramsFromFormData(formData);
  const validation = await validateAuthorizationParams(request, params);
  if ('errorResponse' in validation) {
    return validation.errorResponse;
  }

  const user = await resolveCurrentOAuthUser();
  if (!user) {
    return redirectToSignIn(request);
  }

  if (decision !== 'allow') {
    return redirectWithOAuthError(
      params.redirectUri!,
      'access_denied',
      'The user canceled the Verto AI connection.',
      params.state
    );
  }

  const code = await issueAuthorizationCode({
    userId: user.id,
    clientId: params.clientId!,
    redirectUri: params.redirectUri!,
    scopes: validation.scopes,
    resource: params.resource!,
    codeChallenge: params.codeChallenge!,
    codeChallengeMethod: params.codeChallengeMethod!,
  });

  const redirectUri = new URL(params.redirectUri!);
  redirectUri.searchParams.set('code', code);
  if (params.state) {
    redirectUri.searchParams.set('state', params.state);
  }

  return Response.redirect(redirectUri);
}
