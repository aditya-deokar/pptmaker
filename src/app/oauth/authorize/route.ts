import {
  validateOAuthClient,
  type OAuthClientInfo,
} from '@/mcp/auth/oauth-clients';
import {
  getMcpResourceUrl,
  isExpectedMcpResource,
} from '@/mcp/auth/oauth-config';
import { issueAuthorizationCode } from '@/mcp/auth/oauth-tokens';
import { resolveCurrentOAuthUser } from '@/mcp/auth/oauth-users';
import {
  parseRequestedScopes,
  scopeString,
  type McpOAuthScope,
} from '@/mcp/auth/scopes';

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

type AuthorizationValidationResult =
  | { errorResponse: Response }
  | { client: OAuthClientInfo; scopes: McpOAuthScope[] };

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

function serverError(message: string): Response {
  return Response.json(
    {
      error: 'server_error',
      error_description: message,
    },
    {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    }
  );
}

function getErrorSummary(error: unknown): Record<string, string> {
  if (!error || typeof error !== 'object') {
    return { type: typeof error };
  }

  const record = error as Record<string, unknown>;
  return {
    name: error instanceof Error ? error.name : 'UnknownError',
    code: typeof record.code === 'string' ? record.code : 'UNKNOWN',
  };
}

function isSafeOAuthRedirectUri(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    if (url.hash) {
      return false;
    }

    if (url.protocol === 'https:') {
      return true;
    }

    return (
      url.protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    );
  } catch {
    return false;
  }
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

function handleAuthorizeException(
  error: unknown,
  params: AuthorizationParams,
  stage: 'get' | 'post'
): Response {
  console.error('[OAuth] Authorization request failed', {
    stage,
    ...getErrorSummary(error),
  });

  if (isSafeOAuthRedirectUri(params.redirectUri)) {
    return redirectWithOAuthError(
      params.redirectUri!,
      'server_error',
      'Verto AI could not complete OAuth authorization. Please try reconnecting.',
      params.state
    );
  }

  return serverError(
    'Verto AI could not complete OAuth authorization. Please try reconnecting.'
  );
}

function redirectToSignIn(request: Request): Response {
  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('redirect_url', request.url);
  return Response.redirect(signInUrl);
}

async function validateAuthorizationParams(
  request: Request,
  params: AuthorizationParams
): Promise<AuthorizationValidationResult> {
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
    .map((scope) => `
      <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
        <svg style="width: 20px; height: 20px; color: #10b981; margin-right: 8px; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <code style="padding: 2px 6px; background-color: rgba(0,0,0,0.05); color: #374151; border-radius: 4px; font-size: 12px; font-family: monospace;">${escapeHtml(scope)}</code>
      </li>
    `)
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
  <title>Add Verto AI to ${escapeHtml(clientName)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #1a1a1a; }
    .bg-gradient-premium {
      background: linear-gradient(135deg, #fcebb6 0%, #78c5f9 50%, #4a8df8 100%);
    }
    .glass-panel {
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .logo-connector {
      width: 24px;
      height: 2px;
      background: #e5e7eb;
      margin: 0 8px;
    }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 antialiased">
  <main class="w-full max-w-[480px] overflow-hidden rounded-3xl glass-panel relative">
    
    <!-- Top colorful gradient area -->
    <div class="h-44 w-full bg-gradient-premium absolute top-0 left-0 right-0 z-0 opacity-90 mix-blend-multiply"></div>
    <div class="h-44 w-full bg-gradient-to-b from-transparent to-white absolute top-0 left-0 right-0 z-0"></div>

    <div class="relative z-10 p-8 pt-14">
      
      <!-- Close button (decorative) -->
      <button class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Logos -->
      <div class="flex items-center justify-center mb-8">
        <div class="w-14 h-14 bg-white rounded-[14px] shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden z-10">
          <img src="/new-logo.png" alt="Verto AI" class="w-full h-full object-cover" onerror="this.src='/logoipsum-246.png'" />
        </div>
        <div class="logo-connector -mx-2 z-0"></div>
        <div class="w-14 h-14 bg-[#10a37f] rounded-[14px] shadow-sm flex items-center justify-center overflow-hidden z-10">
          <img src="/globe.svg" alt="${escapeHtml(clientName)}" class="w-8 h-8 object-contain" style="filter: invert(1);" />
        </div>
      </div>

      <!-- Text -->
      <div class="text-center mb-8">
        <h1 class="text-[26px] font-bold text-gray-900 mb-2 leading-tight">Add Verto AI to ${escapeHtml(clientName)}</h1>
        <p class="text-[15px] text-gray-600 font-medium px-4">Create, edit, preview, and publish Verto AI presentations directly from chat.</p>
      </div>

      <!-- Account Info & Permissions -->
      <div class="bg-gray-50/80 rounded-2xl p-5 mb-8 border border-gray-100/80">
        <div class="text-sm text-gray-500 mb-3 flex items-center justify-between">
          <span>Signed in as</span>
          <span class="font-semibold text-gray-800">${escapeHtml(userEmail)}</span>
        </div>
        <div class="w-full h-px bg-gray-200 mb-3"></div>
        <p class="text-xs text-gray-500 mb-3 uppercase font-semibold tracking-wider">Required Permissions</p>
        <ul class="text-sm text-gray-700 m-0 p-0 list-none">
          ${scopeRows}
        </ul>
      </div>

      <form method="post" action="${escapeHtml(new URL('/oauth/authorize', request.url).toString())}">
        ${hiddenInputs}
        
        <div class="flex flex-col gap-3">
          <button class="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-semibold text-[15px] py-3.5 px-4 rounded-full transition-all flex items-center justify-center group" type="submit" name="decision" value="allow">
            <span>Sign in with Verto AI</span>
            <svg class="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <button class="w-full bg-transparent hover:bg-gray-50 text-gray-600 font-medium text-[15px] py-3 px-4 rounded-full transition-colors" type="submit" name="decision" value="deny">
            Cancel
          </button>
        </div>
      </form>

      <!-- Footer text -->
      <div class="mt-8 pt-6 border-t border-gray-100 space-y-4">
        <div class="text-[13px] text-gray-500 leading-relaxed">
          <strong class="text-gray-700 font-semibold block mb-0.5">Permissions always respected.</strong>
          ${escapeHtml(clientName)} is strictly limited to permissions you've explicitly set. Disable access anytime to revoke permissions.
        </div>
        <div class="text-[13px] text-gray-500 leading-relaxed">
          <strong class="text-gray-700 font-semibold block mb-0.5">You're in control.</strong>
          ${escapeHtml(clientName)} always respects your training data preferences. Data from Verto AI may be used to provide you relevant and useful information.
        </div>
      </div>

    </div>
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

  try {
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
  } catch (error) {
    return handleAuthorizeException(error, params, 'get');
  }
}

export async function POST(request: Request): Promise<Response> {
  let params: AuthorizationParams = {
    responseType: null,
    clientId: null,
    redirectUri: null,
    scope: null,
    state: null,
    codeChallenge: null,
    codeChallengeMethod: null,
    resource: null,
  };

  try {
    const formData = await request.formData();
    const decision = formData.get('decision');
    params = paramsFromFormData(formData);
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
  } catch (error) {
    return handleAuthorizeException(error, params, 'post');
  }
}
