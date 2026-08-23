import type { Metadata } from 'next';
import McpUiDemosClient from './McpUiDemosClient';

export const metadata: Metadata = {
  title: 'MCP UI demos — Verto internal',
  robots: { index: false, follow: false },
};

export default function McpUiDemosPage() {
  return <McpUiDemosClient />;
}
