"use server";

import { findOwnedProject } from "@/core/projects/ownership";
import { onAuthenticateUser } from "./user";

type OwnedProjectOptions = {
  includeDeleted?: boolean;
};

export async function getAuthenticatedAppUser() {
  const checkUser = await onAuthenticateUser();

  if (checkUser.status !== 200 || !checkUser.user) {
    return {
      status: 403 as const,
      error: "User not authenticated",
    };
  }

  return {
    status: 200 as const,
    user: checkUser.user,
  };
}

/**
 * Clerk-session wrapper around `core/projects/ownership.findOwnedProject`.
 * Keeps the `{ status, user, project }` envelope consumed by dashboard calls.
 */
export async function getOwnedProject(
  projectId: string,
  options: OwnedProjectOptions = {}
) {
  if (!projectId) {
    return {
      status: 400 as const,
      error: "Project ID is required",
    };
  }

  const auth = await getAuthenticatedAppUser();
  if (auth.status !== 200) {
    return auth;
  }

  const project = await findOwnedProject(projectId, auth.user.id, options);

  if (!project) {
    return {
      status: 404 as const,
      error: "Project not found",
    };
  }

  return {
    status: 200 as const,
    user: auth.user,
    project,
  };
}
