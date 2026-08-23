import {
  ACTION_RESULT_WIDGET_HTML,
  DECK_LIVE_WIDGET_HTML,
  DECK_PREVIEW_WIDGET_HTML,
  GENERATION_PROGRESS_WIDGET_HTML,
  PRESENTATION_LIST_WIDGET_HTML,
  PUBLISH_CARD_WIDGET_HTML,
  THEME_STUDIO_WIDGET_HTML,
} from './generated';

export function getPresentationListWidgetHtml(): string {
  return PRESENTATION_LIST_WIDGET_HTML;
}

export function getGenerationProgressWidgetHtml(): string {
  return GENERATION_PROGRESS_WIDGET_HTML;
}

export function getDeckPreviewWidgetHtml(): string {
  return DECK_PREVIEW_WIDGET_HTML;
}

export function getDeckLiveWidgetHtml(): string {
  return DECK_LIVE_WIDGET_HTML;
}

export function getActionResultWidgetHtml(): string {
  return ACTION_RESULT_WIDGET_HTML;
}

export function getThemeStudioWidgetHtml(): string {
  return THEME_STUDIO_WIDGET_HTML;
}

export function getPublishCardWidgetHtml(): string {
  return PUBLISH_CARD_WIDGET_HTML;
}
