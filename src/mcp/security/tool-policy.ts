import { TOOL_NAMES } from '../config/constants';
import { getRequiredScopesForTool } from '../auth/scopes';

export type ToolOperationKind =
  | 'read'
  | 'status'
  | 'create'
  | 'update'
  | 'publish'
  | 'delete'
  | 'destructive_delete'
  | 'generate'
  | 'unknown';

export interface ToolSecurityPolicy {
  operation: ToolOperationKind;
  readsUserData: boolean;
  writesUserData: boolean;
  destructive: boolean;
  createsPublicUrl: boolean;
  outputMayContainUserContent: boolean;
  requiredScopes: string[];
}

const TOOL_SECURITY_POLICIES: Record<string, ToolSecurityPolicy> = {
  [TOOL_NAMES.PRESENTATION_LIST]: {
    operation: 'read',
    readsUserData: true,
    writesUserData: false,
    destructive: false,
    createsPublicUrl: false,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_LIST),
  },
  [TOOL_NAMES.PRESENTATION_GET]: {
    operation: 'read',
    readsUserData: true,
    writesUserData: false,
    destructive: false,
    createsPublicUrl: false,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_GET),
  },
  [TOOL_NAMES.PRESENTATION_CREATE]: {
    operation: 'create',
    readsUserData: false,
    writesUserData: true,
    destructive: false,
    createsPublicUrl: false,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_CREATE),
  },
  [TOOL_NAMES.PRESENTATION_DELETE]: {
    operation: 'delete',
    readsUserData: true,
    writesUserData: true,
    destructive: false,
    createsPublicUrl: false,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_DELETE),
  },
  [TOOL_NAMES.PRESENTATION_RECOVER]: {
    operation: 'update',
    readsUserData: true,
    writesUserData: true,
    destructive: false,
    createsPublicUrl: false,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_RECOVER),
  },
  [TOOL_NAMES.PRESENTATION_DELETE_PERMANENTLY]: {
    operation: 'destructive_delete',
    readsUserData: true,
    writesUserData: true,
    destructive: true,
    createsPublicUrl: false,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_DELETE_PERMANENTLY),
  },
  [TOOL_NAMES.PRESENTATION_UPDATE_SLIDES]: {
    operation: 'update',
    readsUserData: true,
    writesUserData: true,
    destructive: false,
    createsPublicUrl: false,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_UPDATE_SLIDES),
  },
  [TOOL_NAMES.PRESENTATION_UPDATE_THEME]: {
    operation: 'update',
    readsUserData: true,
    writesUserData: true,
    destructive: false,
    createsPublicUrl: false,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_UPDATE_THEME),
  },
  [TOOL_NAMES.PRESENTATION_PUBLISH]: {
    operation: 'publish',
    readsUserData: true,
    writesUserData: true,
    destructive: false,
    createsPublicUrl: true,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_PUBLISH),
  },
  [TOOL_NAMES.PRESENTATION_UNPUBLISH]: {
    operation: 'publish',
    readsUserData: true,
    writesUserData: true,
    destructive: false,
    createsPublicUrl: false,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_UNPUBLISH),
  },
  [TOOL_NAMES.PRESENTATION_GENERATE]: {
    operation: 'generate',
    readsUserData: false,
    writesUserData: true,
    destructive: false,
    createsPublicUrl: false,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_GENERATE),
  },
  [TOOL_NAMES.PRESENTATION_GENERATION_STATUS]: {
    operation: 'status',
    readsUserData: true,
    writesUserData: false,
    destructive: false,
    createsPublicUrl: false,
    outputMayContainUserContent: true,
    requiredScopes: getRequiredScopesForTool(TOOL_NAMES.PRESENTATION_GENERATION_STATUS),
  },
};

const DEFAULT_TOOL_SECURITY_POLICY: ToolSecurityPolicy = {
  operation: 'unknown',
  readsUserData: false,
  writesUserData: false,
  destructive: false,
  createsPublicUrl: false,
  outputMayContainUserContent: true,
  requiredScopes: [],
};

export function getToolSecurityPolicy(toolName: string): ToolSecurityPolicy {
  return TOOL_SECURITY_POLICIES[toolName] ?? DEFAULT_TOOL_SECURITY_POLICY;
}
