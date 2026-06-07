"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedAppUser } from "./project-access";
import { SEED_TEMPLATES } from "@/lib/templates/seed-templates";
import type { TemplateCategory, TemplateDifficulty } from "@/generated/prisma";

// ─── Types ───

export interface TemplateFilters {
  category?: TemplateCategory;
  search?: string;
  isPremium?: boolean;
  isFeatured?: boolean;
  difficulty?: TemplateDifficulty;
  sortBy?: "popular" | "newest" | "rating";
  page?: number;
  limit?: number;
}

export type TemplateListItem = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  difficulty: TemplateDifficulty;
  slideCount: number;
  themeName: string;
  layoutSequence: string[];
  isPremium: boolean;
  isNew: boolean;
  isFeatured: boolean;
  aiEnhanceable: boolean;
  usageCount: number;
  ratingSum: number;
  ratingCount: number;
  authorName: string;
  createdAt: Date;
};

// ─── Read Operations ───

/** Get paginated templates with filters (metadata only, no slides JSON) */
export async function getTemplates(filters: TemplateFilters = {}) {
  try {
    const {
      category,
      search,
      isPremium,
      isFeatured,
      difficulty,
      sortBy = "popular",
      page = 0,
      limit = 20,
    } = filters;

    const where: any = {
      isPublished: true,
    };

    if (category) where.category = category;
    if (typeof isPremium === "boolean") where.isPremium = isPremium;
    if (typeof isFeatured === "boolean") where.isFeatured = isFeatured;
    if (difficulty) where.difficulty = difficulty;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ];
    }

    const orderBy: any =
      sortBy === "popular"
        ? { usageCount: "desc" }
        : sortBy === "rating"
          ? { ratingSum: "desc" }
          : { createdAt: "desc" };

    const [templates, total] = await Promise.all([
      prisma.presentationTemplate.findMany({
        where,
        orderBy,
        skip: page * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          tags: true,
          difficulty: true,
          slideCount: true,
          themeName: true,
          layoutSequence: true,
          isPremium: true,
          isNew: true,
          isFeatured: true,
          aiEnhanceable: true,
          usageCount: true,
          ratingSum: true,
          ratingCount: true,
          authorName: true,
          createdAt: true,
          // NOTE: slides excluded for performance
        },
      }),
      prisma.presentationTemplate.count({ where }),
    ]);

    return {
      status: 200 as const,
      data: {
        templates: templates as TemplateListItem[],
        total,
        hasMore: (page + 1) * limit < total,
      },
    };
  } catch (error) {
    console.error("getTemplates error:", error);
    return { status: 500 as const, error: "Failed to load templates" };
  }
}

/** Get single template by ID (includes full slides JSON) */
export async function getTemplateById(templateId: string) {
  try {
    const template = await prisma.presentationTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isPublished) {
      return { status: 404 as const, error: "Template not found" };
    }

    return { status: 200 as const, data: template };
  } catch (error) {
    console.error("getTemplateById error:", error);
    return { status: 500 as const, error: "Failed to load template" };
  }
}

/** Get featured templates for gallery hero */
export async function getFeaturedTemplates() {
  try {
    const templates = await prisma.presentationTemplate.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { usageCount: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        tags: true,
        difficulty: true,
        slideCount: true,
        themeName: true,
        layoutSequence: true,
        isPremium: true,
        isNew: true,
        isFeatured: true,
        aiEnhanceable: true,
        usageCount: true,
        ratingSum: true,
        ratingCount: true,
        authorName: true,
        createdAt: true,
      },
    });

    return { status: 200 as const, data: templates as TemplateListItem[] };
  } catch (error) {
    console.error("getFeaturedTemplates error:", error);
    return { status: 500 as const, error: "Failed to load featured templates" };
  }
}

/** Get template category counts for sidebar badges */
export async function getTemplateCategoryCounts() {
  try {
    const counts = await prisma.presentationTemplate.groupBy({
      by: ["category"],
      where: { isPublished: true },
      _count: true,
    });

    const result: Partial<Record<TemplateCategory, number>> = {};
    for (const row of counts) {
      result[row.category] = row._count;
    }

    return { status: 200 as const, data: result };
  } catch (error) {
    console.error("getTemplateCategoryCounts error:", error);
    return { status: 500 as const, error: "Failed to load counts" };
  }
}

// ─── Write Operations ───

/** Clone template into a new Project */
export async function cloneTemplateToProject(
  templateId: string,
  options: { title?: string; themeName?: string } = {}
) {
  try {
    const auth = await getAuthenticatedAppUser();
    if (auth.status !== 200) return auth;

    const template = await prisma.presentationTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { status: 404 as const, error: "Template not found" };
    }

    // Create project from template
    const project = await prisma.project.create({
      data: {
        title: options.title || `${template.name} (Copy)`,
        slides: template.slides ?? undefined,
        outlines: template.outlines,
        themeName: options.themeName || template.themeName,
        userId: auth.user.id,
      },
    });

    // Increment usage counter
    await prisma.presentationTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    return { status: 200 as const, data: { projectId: project.id } };
  } catch (error) {
    console.error("cloneTemplateToProject error:", error);
    return { status: 500 as const, error: "Failed to clone template" };
  }
}

/** Toggle favorite on a template */
export async function toggleTemplateFavorite(templateId: string) {
  try {
    const auth = await getAuthenticatedAppUser();
    if (auth.status !== 200) return auth;

    const existing = await prisma.templateFavorite.findUnique({
      where: {
        userId_templateId: {
          userId: auth.user.id,
          templateId,
        },
      },
    });

    if (existing) {
      await prisma.templateFavorite.delete({ where: { id: existing.id } });
      return { status: 200 as const, data: { isFavorited: false } };
    } else {
      await prisma.templateFavorite.create({
        data: { userId: auth.user.id, templateId },
      });
      return { status: 200 as const, data: { isFavorited: true } };
    }
  } catch (error) {
    console.error("toggleTemplateFavorite error:", error);
    return { status: 500 as const, error: "Failed to toggle favorite" };
  }
}

/** Get user's favorited template IDs */
export async function getUserFavoriteIds() {
  try {
    const auth = await getAuthenticatedAppUser();
    if (auth.status !== 200) return auth;

    const favorites = await prisma.templateFavorite.findMany({
      where: { userId: auth.user.id },
      select: { templateId: true },
    });

    return {
      status: 200 as const,
      data: favorites.map((f) => f.templateId),
    };
  } catch (error) {
    console.error("getUserFavoriteIds error:", error);
    return { status: 500 as const, error: "Failed to load favorites" };
  }
}

// ─── Seed ───

/** Seed the database with built-in templates (idempotent) */
export async function seedTemplates() {
  try {
    const existingCount = await prisma.presentationTemplate.count();
    if (existingCount > 0) {
      return {
        status: 200 as const,
        data: { seeded: 0, message: "Templates already exist" },
      };
    }

    const created = await prisma.presentationTemplate.createMany({
      data: SEED_TEMPLATES.map((t) => ({
        name: t.name,
        description: t.description,
        category: t.category as TemplateCategory,
        tags: t.tags,
        difficulty: t.difficulty as TemplateDifficulty,
        slideCount: t.slideCount,
        slides: t.slides as any,
        themeName: t.themeName,
        layoutSequence: t.layoutSequence,
        outlines: t.outlines,
        isPremium: t.isPremium,
        isFeatured: t.isFeatured,
        aiEnhanceable: true,
        isPublished: true,
        isNew: true,
        previewImages: [],
        authorName: "Verto AI",
      })),
    });

    return {
      status: 200 as const,
      data: { seeded: created.count, message: `Seeded ${created.count} templates` },
    };
  } catch (error) {
    console.error("seedTemplates error:", error);
    return { status: 500 as const, error: "Failed to seed templates" };
  }
}

// ─── Phase 3: Authoring ───

/** Save a project as a reusable template */
export async function saveProjectAsTemplate(
  projectId: string,
  metadata: {
    name: string;
    description: string;
    category: TemplateCategory;
    tags: string[];
    difficulty: TemplateDifficulty;
    isPublic: boolean;
  }
) {
  try {
    const auth = await getAuthenticatedAppUser();
    if (auth.status !== 200) return auth;

    // Fetch the project
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: auth.user.id, isDeleted: false },
    });

    if (!project) {
      return { status: 404 as const, error: "Project not found" };
    }

    if (!project.slides) {
      return { status: 400 as const, error: "Project has no slides" };
    }

    let slides: any[];
    if (typeof project.slides === 'string') {
      try {
        slides = JSON.parse(project.slides);
      } catch (e) {
        return { status: 400 as const, error: "Invalid slides format" };
      }
    } else {
      slides = project.slides as any[];
    }

    if (!Array.isArray(slides)) {
      return { status: 400 as const, error: "Project has no slides" };
    }

    // Build layout sequence and outlines from slide data
    const layoutSequence = slides.map(
      (s: any) => s.type || "titleAndContent"
    );
    const outlines = slides.map(
      (s: any) => s.slideName || `Slide ${(s.slideOrder ?? 0) + 1}`
    );

    // Check private template limit for non-premium users
    if (!metadata.isPublic) {
      const userSub = await prisma.subscription.findUnique({
        where: { userId: auth.user.id },
      });

      const isSubscribed =
        userSub && ["ACTIVE", "ON_TRIAL"].includes(userSub.status);

      // Free users: max 3 private templates, Pro: max 25
      const maxPrivate = isSubscribed ? 25 : 3;
      const existingPrivate = await prisma.presentationTemplate.count({
        where: {
          authorId: auth.user.id,
          isPublished: false,
        },
      });

      if (existingPrivate >= maxPrivate) {
        return {
          status: 403 as const,
          error: `You've reached the maximum of ${maxPrivate} private templates. ${isSubscribed ? "Delete some to create more." : "Upgrade to Pro for up to 25."
            }`,
        };
      }
    }

    // Fetch author name
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { name: true },
    });

    const template = await prisma.presentationTemplate.create({
      data: {
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        tags: metadata.tags,
        difficulty: metadata.difficulty,
        slideCount: slides.length,
        slides: project.slides,
        themeName: project.themeName,
        layoutSequence,
        outlines,
        previewImages: [],
        isPremium: false,
        isNew: true,
        isFeatured: false,
        isPublished: metadata.isPublic,
        aiEnhanceable: true,
        authorId: auth.user.id,
        authorName: user?.name || "Community Member",
      },
    });

    return {
      status: 200 as const,
      data: { templateId: template.id },
    };
  } catch (error: any) {
    console.error("saveProjectAsTemplate error:", error);
    return { status: 500 as const, error: "Failed to save as template: " + (error?.message || String(error)) };
  }
}

/** Rate a template (1-5 stars) */
export async function rateTemplate(templateId: string, rating: number) {
  try {
    const auth = await getAuthenticatedAppUser();
    if (auth.status !== 200) return auth;

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return { status: 400 as const, error: "Rating must be 1-5" };
    }

    // Increment both ratingSum and ratingCount atomically
    const updated = await prisma.presentationTemplate.update({
      where: { id: templateId },
      data: {
        ratingSum: { increment: rating },
        ratingCount: { increment: 1 },
      },
      select: {
        ratingSum: true,
        ratingCount: true,
      },
    });

    const average = updated.ratingCount > 0
      ? updated.ratingSum / updated.ratingCount
      : 0;

    return {
      status: 200 as const,
      data: { average: Math.round(average * 10) / 10, count: updated.ratingCount },
    };
  } catch (error) {
    console.error("rateTemplate error:", error);
    return { status: 500 as const, error: "Failed to rate template" };
  }
}

/** Get templates authored by the current user */
export async function getUserTemplates() {
  try {
    const auth = await getAuthenticatedAppUser();
    if (auth.status !== 200) return auth;

    const templates = await prisma.presentationTemplate.findMany({
      where: { authorId: auth.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        tags: true,
        difficulty: true,
        slideCount: true,
        themeName: true,
        layoutSequence: true,
        isPremium: true,
        isNew: true,
        isFeatured: true,
        aiEnhanceable: true,
        usageCount: true,
        ratingSum: true,
        ratingCount: true,
        authorName: true,
        createdAt: true,
        isPublished: true,
      },
    });

    return { status: 200 as const, data: templates };
  } catch (error) {
    console.error("getUserTemplates error:", error);
    return { status: 500 as const, error: "Failed to load your templates" };
  }
}

/** Delete a user-authored template */
export async function deleteUserTemplate(templateId: string) {
  try {
    const auth = await getAuthenticatedAppUser();
    if (auth.status !== 200) return auth;

    const template = await prisma.presentationTemplate.findFirst({
      where: { id: templateId, authorId: auth.user.id },
    });

    if (!template) {
      return { status: 404 as const, error: "Template not found or not yours" };
    }

    // Delete favorites first, then template
    await prisma.templateFavorite.deleteMany({ where: { templateId } });
    await prisma.presentationTemplate.delete({ where: { id: templateId } });

    return { status: 200 as const, data: { deleted: true } };
  } catch (error) {
    console.error("deleteUserTemplate error:", error);
    return { status: 500 as const, error: "Failed to delete template" };
  }
}

// ─── Phase 4: Premium Gating ───

/** Check if user can access a premium template */
export async function checkPremiumAccess(templateId: string) {
  try {
    const auth = await getAuthenticatedAppUser();
    if (auth.status !== 200) return { ...auth, hasAccess: false };

    const template = await prisma.presentationTemplate.findUnique({
      where: { id: templateId },
      select: { isPremium: true },
    });

    if (!template) {
      return { status: 404 as const, error: "Template not found", hasAccess: false };
    }

    // Non-premium templates are always accessible
    if (!template.isPremium) {
      return { status: 200 as const, hasAccess: true };
    }

    // Check subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: auth.user.id },
    });

    const hasAccess =
      subscription != null &&
      ["ACTIVE", "ON_TRIAL"].includes(subscription.status);

    return { status: 200 as const, hasAccess };
  } catch (error) {
    console.error("checkPremiumAccess error:", error);
    return { status: 500 as const, error: "Failed to check access", hasAccess: false };
  }
}

