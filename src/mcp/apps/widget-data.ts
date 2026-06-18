import type {
  PresentationGenerationStatusMcpResponse,
  PresentationGenerationRunMcpResponse,
} from '../lib/presentation-generation-runs';
import type { PresentationMCPResponse } from '../tools/presentation/mappers';

const WIDGET_DATA_VERSION = 1;
const FALLBACK_PUBLIC_APP_URL = 'https://verto.ai.aditya-deokar.me';
const MAX_DECK_PREVIEW_SLIDES = 6;
const MAX_PREVIEW_TEXT_LENGTH = 180;

export type VertoMcpAppWidgetKind =
  | 'deck_preview'
  | 'generation_progress'
  | 'publish_card'
  | 'theme_studio';

export interface BaseWidgetData {
  widget: VertoMcpAppWidgetKind;
  version: typeof WIDGET_DATA_VERSION;
}

export interface DeckPreviewSlide {
  id: string;
  title: string;
  order: number;
  previewText: string;
  visualHint?: string;
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
  slides: DeckPreviewSlide[];
  actions: {
    canOpen: boolean;
    canRefresh: boolean;
    canPublish: boolean;
    canUnpublish: boolean;
    canCopyShareLink: boolean;
  };
}

export interface GenerationProgressStep {
  id: string;
  name: string;
  status: string;
  details?: string;
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
    updatedAt: string | null;
    isComplete: boolean;
    isFailed: boolean;
    pollHint: string | null;
  };
  steps: GenerationProgressStep[];
  presentation: {
    id: string;
    openUrl: string;
  } | null;
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

export interface ThemeStudioWidgetData extends BaseWidgetData {
  widget: 'theme_studio';
  presentation: {
    id: string;
    title: string;
    currentThemeName: string | null;
  };
  themes: Array<{
    name: string;
    colors: string[];
    description?: string;
  }>;
  actions: {
    canApplyTheme: boolean;
  };
}

export type McpAppWidgetData =
  | DeckPreviewWidgetData
  | GenerationProgressWidgetData
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
    slides: mapDeckSlides(presentation.slides),
    actions: {
      canOpen: Boolean(openUrl),
      canRefresh: true,
      canPublish: !presentation.is_published && !presentation.is_deleted,
      canUnpublish: presentation.is_published && !presentation.is_deleted,
      canCopyShareLink: Boolean(presentation.share_url),
    },
  };
}

export function createGenerationProgressWidgetData(
  status: PresentationGenerationStatusMcpResponse
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
      updatedAt: run.updated_at,
      isComplete: status.is_complete,
      isFailed: status.is_failed,
      pollHint: status.poll_hint ?? null,
    },
    steps: run.steps.map((step) => ({
      id: step.id,
      name: step.name,
      status: step.status,
      ...(step.details ? { details: step.details } : {}),
    })),
    presentation: status.presentation_id && openUrl
      ? {
          id: status.presentation_id,
          openUrl,
        }
      : null,
    actions: {
      canRefresh: !status.is_complete && !status.is_failed,
      canOpenPresentation: Boolean(status.presentation_id && openUrl),
      canInspectPresentation: Boolean(status.presentation_id),
      canRetry: status.is_failed,
    },
  };
}
