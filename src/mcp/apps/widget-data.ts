import type {
  PresentationGenerationStatusMcpResponse,
  PresentationGenerationRunMcpResponse,
} from '../lib/presentation-generation-runs';
import type { PaginationMeta } from '../tools/_shared/pagination';
import type { PresentationMCPResponse } from '../tools/presentation/mappers';
import { VERTO_THEMES } from './generated/themes-data';

const WIDGET_DATA_VERSION = 2;
const FALLBACK_PUBLIC_APP_URL = 'https://verto.ai.aditya-deokar.me';
const MAX_DECK_PREVIEW_SLIDES = 50;
const MAX_PREVIEW_TEXT_LENGTH = 180;

export type VertoMcpAppWidgetKind =
  | 'presentation_list'
  | 'deck_preview'
  | 'deck_live'
  | 'generation_progress'
  | 'action_result'
  | 'publish_card'
  | 'theme_studio';

export interface BaseWidgetData {
  widget: VertoMcpAppWidgetKind;
  version: typeof WIDGET_DATA_VERSION;
}

/**
 * Deep links into the real product (plan 10 F9): editor, presenter, and
 * public share routes for the primary presentation of a widget payload.
 */
export interface WidgetLinks {
  editorUrl: string | null;
  presentUrl: string | null;
  shareUrl: string | null;
}

export interface DeckPreviewSlide {
  id: string;
  title: string;
  order: number;
  previewText: string;
  visualHint?: string;
  content?: unknown;
}

export interface PresentationListItem {
  id: string;
  title: string;
  themeName: string | null;
  slideCount: number;
  updatedAt: string | null;
  isPublished: boolean;
  isDeleted: boolean;
  shareUrl: string | null;
  openUrl: string | null;
}

export interface PresentationListWidgetData extends BaseWidgetData {
  widget: 'presentation_list';
  presentations: PresentationListItem[];
  links: WidgetLinks;
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    totalCount: number;
    pageSize: number;
  };
  summary: {
    shownCount: number;
    totalCount: number;
    publishedCount: number;
    draftCount: number;
    deletedCount: number;
  };
  actions: {
    canRefresh: boolean;
    canOpenLatest: boolean;
    canPreviewLatest: boolean;
  };
}

export interface DeckPreviewWidgetData extends BaseWidgetData {
  widget: 'deck_preview';
  presentation: {
    id: string;
    title: string;
    themeName: string | null;
    slideCount: number;
    updatedAt: string | null;
    isPublished: boolean;
    shareUrl: string | null;
    openUrl: string | null;
  };
  links: WidgetLinks;
  slides: DeckPreviewSlide[];
  actions: {
    canOpen: boolean;
    canRefresh: boolean;
    canPublish: boolean;
    canUnpublish: boolean;
    canCopyShareLink: boolean;
    canUpdateSlides: boolean;
  };
}

export interface DeckLiveWidgetData extends BaseWidgetData {
  widget: 'deck_live';
  presentation: {
    id: string;
    title: string;
    themeName: string | null;
    slideCount: number;
  };
  links: WidgetLinks;
  slides: DeckPreviewSlide[];
  actions: {
    canRefresh: boolean;
  };
}

export interface GenerationProgressStep {
  id: string;
  name: string;
  status: string;
  description?: string;
  details?: string;
}

/**
 * Plan 10 F7: completion snapshot embedded in the progress payload so the
 * widget can celebrate inline (first-slide preview + slide count) without a
 * second tool round-trip.
 */
export interface GenerationCompletionInfo {
  slideCount: number;
  themeName: string | null;
  previewSlide: DeckPreviewSlide | null;
}

export type ActionResultKind =
  | 'create'
  | 'update_slides'
  | 'update_theme'
  | 'publish'
  | 'unpublish'
  | 'delete'
  | 'recover'
  | 'delete_permanently';

export interface ActionResultAffectedPresentation {
  id: string;
  title: string;
}

export interface ActionResultWidgetData extends BaseWidgetData {
  widget: 'action_result';
  operation: {
    kind: ActionResultKind;
    title: string;
    message: string;
    status: 'success' | 'warning';
    completedAt: string;
  };
  presentation: {
    id: string;
    title: string;
    themeName: string | null;
    slideCount: number;
    updatedAt: string | null;
    isPublished: boolean;
    isDeleted: boolean;
    shareUrl: string | null;
    openUrl: string | null;
  } | null;
  links: WidgetLinks;
  affectedPresentations: ActionResultAffectedPresentation[];
  actions: {
    canOpen: boolean;
    canPreview: boolean;
    canCopyShareLink: boolean;
  };
}

export interface GenerationProgressWidgetData extends BaseWidgetData {
  widget: 'generation_progress';
  generation: {
    runId: string;
    topic: string;
    status: PresentationGenerationRunMcpResponse['status'];
    progress: number;
    currentStepName: string | null;
    error: string | null;
    presentationId: string | null;
    createdAt: string | null;
    completedAt: string | null;
    updatedAt: string | null;
    isComplete: boolean;
    isFailed: boolean;
    pollHint: string | null;
  };
  steps: GenerationProgressStep[];
  links: WidgetLinks;
  presentation: {
    id: string;
    openUrl: string;
  } | null;
  completion?: GenerationCompletionInfo | null;
  actions: {
    canRefresh: boolean;
    canOpenPresentation: boolean;
    canInspectPresentation: boolean;
    canRetry: boolean;
  };
}

export interface PublishCardWidgetData extends BaseWidgetData {
  widget: 'publish_card';
  presentation: {
    id: string;
    title: string;
    isPublished: boolean;
    shareUrl: string | null;
  };
  actions: {
    canCopyShareLink: boolean;
    canOpenShareLink: boolean;
    canUnpublish: boolean;
  };
}

export interface ThemeStudioThemeOption {
  name: string;
  /** [background, accent, font] preview colors for the mini slide mock. */
  colors: [string, string, string];
  description?: string;
  isNew?: boolean;
}

export interface ThemeStudioWidgetData extends BaseWidgetData {
  widget: 'theme_studio';
  presentation: {
    id: string;
    title: string;
    currentThemeName: string | null;
  };
  themes: ThemeStudioThemeOption[];
  actions: {
    canApplyTheme: boolean;
  };
}

export type McpAppWidgetData =
  | PresentationListWidgetData
  | DeckPreviewWidgetData
  | DeckLiveWidgetData
  | GenerationProgressWidgetData
  | ActionResultWidgetData
  | PublishCardWidgetData
  | ThemeStudioWidgetData;

function getPublicAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL
    || process.env.OAUTH_ISSUER
    || FALLBACK_PUBLIC_APP_URL
  ).replace(/\/+$/, '');
}

function buildPresentationOpenUrl(presentationId: string | null | undefined): string | null {
  return presentationId ? `${getPublicAppUrl()}/presentation/${presentationId}` : null;
}

function buildPresentationPresentUrl(presentationId: string | null | undefined): string | null {
  return presentationId ? `${getPublicAppUrl()}/present/${presentationId}` : null;
}

function buildWidgetLinks(options: {
  presentationId: string | null | undefined;
  shareUrl?: string | null;
  openUrl?: string | null;
}): WidgetLinks {
  const editorUrl = options.openUrl || buildPresentationOpenUrl(options.presentationId);

  return {
    editorUrl,
    presentUrl: buildPresentationPresentUrl(options.presentationId),
    shareUrl: options.shareUrl || null,
  };
}

function readString(value: unknown, key: string): string | null {
  if (!value || typeof value !== 'object' || !(key in value)) {
    return null;
  }

  const item = (value as Record<string, unknown>)[key];
  return typeof item === 'string' && item.trim() ? item : null;
}

function readNumber(value: unknown, key: string): number | null {
  if (!value || typeof value !== 'object' || !(key in value)) {
    return null;
  }

  const item = (value as Record<string, unknown>)[key];
  return typeof item === 'number' && Number.isFinite(item) ? item : null;
}

function truncateText(value: string, maxLength = MAX_PREVIEW_TEXT_LENGTH): string {
  const compact = value.replace(/\s+/g, ' ').trim();

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 1).trim()}...`;
}

function extractSlideTitle(slide: unknown, fallback: string): string {
  return (
    readString(slide, 'title')
    || readString(slide, 'slideName')
    || readString(slide, 'slide_name')
    || fallback
  );
}

function extractSlidePreviewText(slide: unknown): string {
  return truncateText(
    readString(slide, 'previewText')
    || readString(slide, 'preview_text')
    || readString(slide, 'subtitle')
    || readString(slide, 'description')
    || readString(slide, 'body')
    || readString(slide, 'content')
    || ''
  );
}

function extractVisualHint(slide: unknown): string | undefined {
  return (
    readString(slide, 'layout')
    || readString(slide, 'type')
    || readString(slide, 'variant')
    || undefined
  );
}

function mapDeckSlides(slides: unknown[] | undefined): DeckPreviewSlide[] {
  if (!Array.isArray(slides)) {
    return [];
  }

  return slides.slice(0, MAX_DECK_PREVIEW_SLIDES).map((slide, index) => {
    const order = readNumber(slide, 'order') ?? readNumber(slide, 'slideOrder') ?? index;

    return {
      id: readString(slide, 'id') || `slide-${index + 1}`,
      title: extractSlideTitle(slide, `Slide ${index + 1}`),
      order,
      previewText: extractSlidePreviewText(slide),
      ...(extractVisualHint(slide) ? { visualHint: extractVisualHint(slide) } : {}),
      content: slide && typeof slide === 'object' && 'content' in slide ? (slide as any).content : undefined,
    };
  });
}

export function createDeckPreviewWidgetData(
  presentation: PresentationMCPResponse
): DeckPreviewWidgetData {
  const openUrl = presentation.open_url || buildPresentationOpenUrl(presentation.id);

  return {
    widget: 'deck_preview',
    version: WIDGET_DATA_VERSION,
    presentation: {
      id: presentation.id,
      title: presentation.title,
      themeName: presentation.theme_name || null,
      slideCount: presentation.slide_count,
      updatedAt: presentation.updated_at || null,
      isPublished: presentation.is_published,
      shareUrl: presentation.share_url,
      openUrl,
    },
    links: buildWidgetLinks({
      presentationId: presentation.id,
      shareUrl: presentation.share_url,
      openUrl,
    }),
    slides: mapDeckSlides(presentation.slides),
    actions: {
      canOpen: Boolean(openUrl),
      canRefresh: true,
      canPublish: !presentation.is_published && !presentation.is_deleted,
      canUnpublish: presentation.is_published && !presentation.is_deleted,
      canCopyShareLink: presentation.is_published && !presentation.is_deleted,
      canUpdateSlides: Boolean(presentation.id && !presentation.is_deleted),
    },
  };
}

/**
 * Slim payload for the app-only presenter view (plan 10 F2/§7.3): slides
 * with full content trees plus theme metadata — no action-result prose.
 */
export function createDeckLiveWidgetData(
  presentation: PresentationMCPResponse
): DeckLiveWidgetData {
  const openUrl = presentation.open_url || buildPresentationOpenUrl(presentation.id);

  return {
    widget: 'deck_live',
    version: WIDGET_DATA_VERSION,
    presentation: {
      id: presentation.id,
      title: presentation.title,
      themeName: presentation.theme_name || null,
      slideCount: presentation.slide_count,
    },
    links: buildWidgetLinks({
      presentationId: presentation.id,
      shareUrl: presentation.share_url,
      openUrl,
    }),
    slides: mapDeckSlides(presentation.slides),
    actions: {
      canRefresh: true,
    },
  };
}

/**
 * Visual theme browser payload (plan 10 F4). The catalog mirrors the
 * dashboard's 65 themes (generated/themes-data.ts) so widgets and server
 * never drift; colors are [background, accent, font] preview triplets.
 */
export function createThemeStudioWidgetData(options: {
  presentation: Pick<PresentationMCPResponse, 'id' | 'title' | 'theme_name'>;
}): ThemeStudioWidgetData {
  const themes: ThemeStudioThemeOption[] = VERTO_THEMES.map((theme) => ({
    name: theme.name,
    colors: [
      theme.gradientBackground || theme.slideBackgroundColor || theme.backgroundColor,
      theme.accentColor,
      theme.fontColor,
    ],
    description: theme.type === 'dark' ? 'Dark theme' : 'Light theme',
    isNew: NEW_THEME_NAMES.has(theme.name),
  }));

  return {
    widget: 'theme_studio',
    version: WIDGET_DATA_VERSION,
    presentation: {
      id: options.presentation.id,
      title: options.presentation.title,
      currentThemeName: options.presentation.theme_name || null,
    },
    themes,
    actions: {
      canApplyTheme: true,
    },
  };
}

/** Newest catalog additions flagged with a "NEW" badge in the studio. */
const NEW_THEME_NAMES = new Set([
  'Obsidian Flame',
  'Modern Dark',
  'Vibrant Glass',
  'Premium Gradient',
]);

export function createPublishCardWidgetData(
  presentation: PresentationMCPResponse
): PublishCardWidgetData {
  return {
    widget: 'publish_card',
    version: WIDGET_DATA_VERSION,
    presentation: {
      id: presentation.id,
      title: presentation.title,
      isPublished: presentation.is_published,
      shareUrl: presentation.share_url,
    },
    actions: {
      canCopyShareLink: Boolean(presentation.share_url) && !presentation.is_deleted,
      canOpenShareLink: Boolean(presentation.share_url) && !presentation.is_deleted,
      canUnpublish: presentation.is_published && !presentation.is_deleted,
    },
  };
}

export function createPresentationListWidgetData(
  presentations: PresentationMCPResponse[],
  pagination: PaginationMeta
): PresentationListWidgetData {
  const items = presentations.map((presentation) => ({
    id: presentation.id,
    title: presentation.title,
    themeName: presentation.theme_name || null,
    slideCount: presentation.slide_count,
    updatedAt: presentation.updated_at || null,
    isPublished: presentation.is_published,
    isDeleted: presentation.is_deleted,
    shareUrl: presentation.share_url,
    openUrl: presentation.open_url || buildPresentationOpenUrl(presentation.id),
  }));
  const latest = items[0];

  return {
    widget: 'presentation_list',
    version: WIDGET_DATA_VERSION,
    presentations: items,
    links: buildWidgetLinks({
      presentationId: latest?.id ?? null,
      shareUrl: latest?.shareUrl ?? null,
      openUrl: latest?.openUrl ?? null,
    }),
    pagination: {
      nextCursor: pagination.next_cursor,
      hasMore: pagination.has_more,
      totalCount: pagination.total_count,
      pageSize: pagination.page_size,
    },
    summary: {
      shownCount: items.length,
      totalCount: pagination.total_count,
      publishedCount: items.filter((presentation) => presentation.isPublished).length,
      draftCount: items.filter((presentation) => !presentation.isPublished && !presentation.isDeleted).length,
      deletedCount: items.filter((presentation) => presentation.isDeleted).length,
    },
    actions: {
      canRefresh: true,
      canOpenLatest: Boolean(latest?.openUrl),
      canPreviewLatest: Boolean(latest?.id),
    },
  };
}

/**
 * F7: builds the completion snapshot from a finished deck's slide array.
 */
export function createGenerationCompletionInfo(
  slides: unknown,
  themeName?: string | null
): GenerationCompletionInfo {
  const list = Array.isArray(slides) ? slides : [];
  const mapped = list.length > 0 ? mapDeckSlides(list.slice(0, 1)) : [];

  return {
    slideCount: list.length,
    themeName: themeName || null,
    previewSlide: mapped[0] ?? null,
  };
}

export function createGenerationProgressWidgetData(
  status: PresentationGenerationStatusMcpResponse,
  completion: GenerationCompletionInfo | null = null
): GenerationProgressWidgetData {
  const run = status.generation_run;
  const openUrl = buildPresentationOpenUrl(status.presentation_id);

  return {
    widget: 'generation_progress',
    version: WIDGET_DATA_VERSION,
    generation: {
      runId: status.generation_run_id,
      topic: run.topic,
      status: status.status,
      progress: Math.max(0, Math.min(100, run.progress)),
      currentStepName: run.current_step_name,
      error: run.error,
      presentationId: status.presentation_id,
      createdAt: run.created_at || null,
      completedAt: run.completed_at || null,
      updatedAt: run.updated_at,
      isComplete: status.is_complete,
      isFailed: status.is_failed,
      pollHint: status.poll_hint ?? null,
    },
    steps: run.steps.map((step) => ({
      id: step.id,
      name: step.name,
      status: step.status,
      ...(step.description ? { description: step.description } : {}),
      ...(step.details ? { details: step.details } : {}),
    })),
    links: buildWidgetLinks({
      presentationId: status.presentation_id,
      openUrl,
    }),
    presentation: status.presentation_id && openUrl
      ? {
          id: status.presentation_id,
          openUrl,
        }
      : null,
    ...(completion ? { completion } : {}),
    actions: {
      canRefresh: !status.is_complete && !status.is_failed,
      canOpenPresentation: Boolean(status.presentation_id && openUrl),
      canInspectPresentation: Boolean(status.presentation_id),
      canRetry: status.is_failed,
    },
  };
}

export function createActionResultWidgetData(options: {
  kind: ActionResultKind;
  title: string;
  message: string;
  presentation?: PresentationMCPResponse | null;
  affectedPresentations?: ActionResultAffectedPresentation[];
  status?: 'success' | 'warning';
}): ActionResultWidgetData {
  const presentation = options.presentation;
  const openUrl = presentation
    ? presentation.open_url || buildPresentationOpenUrl(presentation.id)
    : null;

  return {
    widget: 'action_result',
    version: WIDGET_DATA_VERSION,
    operation: {
      kind: options.kind,
      title: options.title,
      message: options.message,
      status: options.status || 'success',
      completedAt: new Date().toISOString(),
    },
    presentation: presentation
      ? {
          id: presentation.id,
          title: presentation.title,
          themeName: presentation.theme_name || null,
          slideCount: presentation.slide_count,
          updatedAt: presentation.updated_at || null,
          isPublished: presentation.is_published,
          isDeleted: presentation.is_deleted,
          shareUrl: presentation.share_url,
          openUrl,
        }
      : null,
    affectedPresentations: options.affectedPresentations || [],
    links: presentation
      ? buildWidgetLinks({
          presentationId: presentation.id,
          shareUrl: presentation.share_url,
          openUrl,
        })
      : { editorUrl: null, presentUrl: null, shareUrl: null },
    actions: {
      canOpen: Boolean(openUrl && !presentation?.is_deleted),
      canPreview: Boolean(presentation?.id && !presentation?.is_deleted),
      canCopyShareLink: Boolean(presentation?.share_url),
    },
  };
}
