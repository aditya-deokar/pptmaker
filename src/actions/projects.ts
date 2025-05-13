'use server'


import prisma from "@/lib/prisma";
import { onAuthenticateUser } from "./user"

export const getAllProjects =async ()=>{
    try {
        const checkUser = await onAuthenticateUser();
        if(checkUser.status!==200 || !checkUser.user){
            return {
                status:403,
                error:"User Not Authenticated"
            }
        }

        const projects= await prisma.project.findMany({
            where:{
                userId:checkUser.user.id,
                isDeleted:false,
            },
            orderBy:{
                updatedAt:'desc',
            },

        })


        if(projects.length===0){
            return {
                status:404,
                error:"No Projects Found"
            }
        }

        return {
            status:200,
            data:projects
        }
    } catch (error) {
        console.log("🔴 ERROR", error);
        return {
             status: 500 ,
             error:"Internal Server Error"
            };
    }
}

export const getRecentProjects = async () => {
  try {
    const checkUser = await onAuthenticateUser();

    if (checkUser.status !== 200 || !checkUser.user) {
      return { status: 403, error: "User not authenticated" };
    }

    // Fetch the recent prompts for the user
    const projects = await prisma.project.findMany({
      where: {
        userId: checkUser.user.id,
        isDeleted: false,
      },

      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    });

    if (projects.length === 0) {
      return { status: 404, error: "No recent prompts found" };
    }

    return { status: 200, data: projects };
  } catch (error) {
    console.error("🔴 ERROR", error);
    return { status: 500, error: "Internal server error" };
  }
};




export const deleteProject = async (projectId: string) => {
  try {
    console.log("Deleting project with ID:", projectId);
    const checkUser = await onAuthenticateUser();

    if (checkUser.status !== 200 || !checkUser.user) {
      return { status: 403, error: "User not authenticated" };
    }

    // Update the project to mark it as deleted
    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        isDeleted: true,
      },
    });

    if (!updatedProject) {
      return { status: 500, error: "Failed to delete project" };
    }

    return { status: 200, data: updatedProject };
  } catch (error) {
    console.log("🔴 ERROR", error);
    return { status: 500, error: "Internal server error" };
  }
};

export const getDeletedProjects = async () => {
  try {
    const checkUser = await onAuthenticateUser();

    if (checkUser.status !== 200 || !checkUser.user) {
      return { status: 403, error: "User not authenticated" };
    }

    // Fetch the deleted projects for the user
    const projects = await prisma.project.findMany({
      where: {
        userId: checkUser.user.id,
        isDeleted: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (projects.length === 0) {
      return { status: 200, message: "No deleted projects found", data: [] };
    }

    return { status: 200, data: projects };
  } catch (error) {
    console.error("🔴 ERROR", error);
    return { status: 500, error: "Internal server error" };
  }
};

export const recoverProject = async (projectId: string) => {
  try {
    console.log("Recovering project with ID:", projectId);
    const checkUser = await onAuthenticateUser();

    if (checkUser.status !== 200 || !checkUser.user) {
      return { status: 403, error: "User not authenticated" };
    }

    // Update the project to mark it as deleted
    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        isDeleted: false,
      },
    });

    if (!updatedProject) {
      return { status: 500, error: "Failed to recover project" };
    }

    return { status: 200, data: updatedProject };
  } catch (error) {
    console.log("🔴 ERROR", error);
    return { status: 500, error: "Internal server error" };
  }
};

export const deleteAllProjects = async (projectIds: string[]) => {
  try {
    console.log("Deleting all projects with IDs:", projectIds);

    // Validate input
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return { status: 400, error: "No project IDs provided." };
    }

    // Authenticate user
    const checkUser = await onAuthenticateUser();

    if (checkUser.status !== 200 || !checkUser.user) {
      return { status: 403, error: "User not authenticated." };
    }

    const userId = checkUser.user.id;

    // Ensure projects belong to the authenticated user
    const projectsToDelete = await prisma.project.findMany({
      where: {
        id: {
          in: projectIds,
        },
        userId: userId, // Only delete projects owned by this user
      },
    });

    if (projectsToDelete.length === 0) {
      return { status: 404, error: "No projects found for the given IDs." };
    }

    // Delete the projects
    const deletedProjects = await prisma.project.deleteMany({
      where: {
        id: {
          in: projectsToDelete.map((project) => project.id),
        },
      },
    });

    console.log("Deleted projects count:", deletedProjects.count);

    return {
      status: 200,
      message: `${deletedProjects.count} projects successfully deleted.`,
    };
  } catch (error) {
    console.error("🔴 ERROR", error);
    return { status: 500, error: "Internal server error." };
  }
};