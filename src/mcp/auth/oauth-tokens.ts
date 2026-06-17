import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import prisma from '@/lib/prisma';
import { SubscriptionStatus } from '@/generated/prisma';
import type { AuthContext, UserTier } from './types';
import {
  getMcpResourceUrl,
  isExpectedMcpResource,
  normalizeResourceUri,
} from './oauth-config';

const ACCESS_TOKEN_PREFIX = 'vto_at_';
const REFRESH_TOKEN_PREFIX = 'vto_rt_';
const AUTH_CODE_PREFIX = 'vto_code_';

export interface OAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  scope: string;
  resource: string;
}

interface IssueAuthorizationCodeInput {
  userId: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  resource: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

interface ExchangeAuthorizationCodeInput {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
  resource?: string | null;
}

interface RefreshAccessTokenInput {
  refreshToken: string;
  clientId: string;
  resource?: string | null;
}

function nowPlusSeconds(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}

function getAccessTokenTtlSeconds(): number {
  return Number(process.env.OAUTH_ACCESS_TOKEN_TTL_SECONDS || 3600);
}

function getRefreshTokenTtlSeconds(): number {
  return Number(process.env.OAUTH_REFRESH_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 30);
}

function getAuthorizationCodeTtlSeconds(): number {
  return Number(process.env.OAUTH_AUTH_CODE_TTL_SECONDS || 600);
}

function createOpaqueToken(prefix: string): string {
  return `${prefix}${randomBytes(32).toString('base64url')}`;
}

export function hashOAuthToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

function scopeString(scopes: readonly string[]): string {
  return scopes.join(' ');
}

function resolveUserTier(status?: SubscriptionStatus | null): UserTier {
  if (status === SubscriptionStatus.ACTIVE) {
    return 'pro';
  }

  return 'free';
}

function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  const computed = createHash('sha256').update(codeVerifier).digest('base64url');
  const computedBuffer = Buffer.from(computed);
  const expectedBuffer = Buffer.from(codeChallenge);

  return (
    computedBuffer.length === expectedBuffer.length
    && timingSafeEqual(computedBuffer, expectedBuffer)
  );
}

async function issueTokenPair(input: {
  userId: string;
  clientId: string;
  scopes: string[];
  resource: string;
}): Promise<OAuthTokenResponse> {
  const accessToken = createOpaqueToken(ACCESS_TOKEN_PREFIX);
  const refreshToken = createOpaqueToken(REFRESH_TOKEN_PREFIX);
  const accessTokenTtl = getAccessTokenTtlSeconds();

  await prisma.$transaction([
    prisma.mcpOAuthAccessToken.create({
      data: {
        tokenHash: hashOAuthToken(accessToken),
        userId: input.userId,
        clientId: input.clientId,
        scopes: input.scopes,
        resource: normalizeResourceUri(input.resource),
        expiresAt: nowPlusSeconds(accessTokenTtl),
      },
    }),
    prisma.mcpOAuthRefreshToken.create({
      data: {
        tokenHash: hashOAuthToken(refreshToken),
        userId: input.userId,
        clientId: input.clientId,
        scopes: input.scopes,
        resource: normalizeResourceUri(input.resource),
        expiresAt: nowPlusSeconds(getRefreshTokenTtlSeconds()),
      },
    }),
  ]);

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: accessTokenTtl,
    refresh_token: refreshToken,
    scope: scopeString(input.scopes),
    resource: normalizeResourceUri(input.resource),
  };
}

export async function issueAuthorizationCode(
  input: IssueAuthorizationCodeInput
): Promise<string> {
  const code = createOpaqueToken(AUTH_CODE_PREFIX);

  await prisma.mcpOAuthAuthorizationCode.create({
    data: {
      codeHash: hashOAuthToken(code),
      userId: input.userId,
      clientId: input.clientId,
      redirectUri: input.redirectUri,
      scopes: input.scopes,
      resource: normalizeResourceUri(input.resource),
      codeChallenge: input.codeChallenge,
      codeChallengeMethod: input.codeChallengeMethod,
      expiresAt: nowPlusSeconds(getAuthorizationCodeTtlSeconds()),
    },
  });

  return code;
}

export async function exchangeAuthorizationCode(
  input: ExchangeAuthorizationCodeInput
): Promise<OAuthTokenResponse | null> {
  const code = await prisma.mcpOAuthAuthorizationCode.findUnique({
    where: { codeHash: hashOAuthToken(input.code) },
  });

  const requestedResource = input.resource
    ? normalizeResourceUri(input.resource)
    : normalizeResourceUri(code?.resource ?? getMcpResourceUrl());

  if (
    !code
    || code.usedAt
    || code.expiresAt <= new Date()
    || code.clientId !== input.clientId
    || code.redirectUri !== input.redirectUri
    || normalizeResourceUri(code.resource) !== requestedResource
    || code.codeChallengeMethod !== 'S256'
    || !verifyPkceS256(input.codeVerifier, code.codeChallenge)
  ) {
    return null;
  }

  const codeUpdate = await prisma.mcpOAuthAuthorizationCode.updateMany({
    where: {
      id: code.id,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  if (codeUpdate.count !== 1) {
    return null;
  }

  return issueTokenPair({
    userId: code.userId,
    clientId: code.clientId,
    scopes: code.scopes,
    resource: code.resource,
  });
}

export async function refreshAccessToken(
  input: RefreshAccessTokenInput
): Promise<OAuthTokenResponse | null> {
  const refreshToken = await prisma.mcpOAuthRefreshToken.findUnique({
    where: { tokenHash: hashOAuthToken(input.refreshToken) },
  });

  const requestedResource = input.resource && refreshToken
    ? normalizeResourceUri(input.resource)
    : normalizeResourceUri(refreshToken?.resource ?? getMcpResourceUrl());

  if (
    !refreshToken
    || refreshToken.revokedAt
    || refreshToken.expiresAt <= new Date()
    || refreshToken.clientId !== input.clientId
    || normalizeResourceUri(refreshToken.resource) !== requestedResource
  ) {
    return null;
  }

  const tokenResponse = await issueTokenPair({
    userId: refreshToken.userId,
    clientId: refreshToken.clientId,
    scopes: refreshToken.scopes,
    resource: refreshToken.resource,
  });

  await prisma.mcpOAuthRefreshToken.update({
    where: { id: refreshToken.id },
    data: {
      revokedAt: new Date(),
      rotatedAt: new Date(),
    },
  });

  return tokenResponse;
}

export async function revokeOAuthToken(token: string): Promise<void> {
  const tokenHash = hashOAuthToken(token);
  const revokedAt = new Date();

  await prisma.$transaction([
    prisma.mcpOAuthAccessToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: { revokedAt },
    }),
    prisma.mcpOAuthRefreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: { revokedAt },
    }),
  ]);
}

export async function validateOAuthAccessToken(
  token: string,
  requestUrl?: string | URL
): Promise<AuthContext | null> {
  if (!token.startsWith(ACCESS_TOKEN_PREFIX)) {
    return null;
  }

  const accessToken = await prisma.mcpOAuthAccessToken.findUnique({
    where: { tokenHash: hashOAuthToken(token) },
    include: {
      user: {
        include: {
          Subscription: { select: { status: true } },
        },
      },
    },
  });

  if (
    !accessToken
    || accessToken.revokedAt
    || accessToken.expiresAt <= new Date()
    || !isExpectedMcpResource(accessToken.resource, requestUrl || getMcpResourceUrl())
  ) {
    return null;
  }

  prisma.mcpOAuthAccessToken.update({
    where: { id: accessToken.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => undefined);

  return {
    userId: accessToken.user.id,
    clerkId: accessToken.user.clerkId,
    email: accessToken.user.email,
    tier: resolveUserTier(accessToken.user.Subscription?.status),
    authMethod: 'oauth',
    scopes: accessToken.scopes,
    clientId: accessToken.clientId,
    resource: accessToken.resource,
  };
}
