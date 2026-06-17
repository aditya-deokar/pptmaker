import {
  getOAuthAuthorizationEndpoint,
  getOAuthIssuer,
  getOAuthRegistrationEndpoint,
  getOAuthRevocationEndpoint,
  getOAuthTokenEndpoint,
} from './oauth-config';
import { getAllMcpOAuthScopes } from './scopes';

export function getAuthorizationServerMetadata(requestUrl?: string | URL) {
  return {
    issuer: getOAuthIssuer(requestUrl),
    authorization_endpoint: getOAuthAuthorizationEndpoint(requestUrl),
    token_endpoint: getOAuthTokenEndpoint(requestUrl),
    revocation_endpoint: getOAuthRevocationEndpoint(requestUrl),
    registration_endpoint: getOAuthRegistrationEndpoint(requestUrl),
    client_id_metadata_document_supported: true,
    token_endpoint_auth_methods_supported: ['none'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: getAllMcpOAuthScopes(),
  };
}
