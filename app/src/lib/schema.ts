import type { ViewerData } from '../types';
import { createEmptyViewerData, createExampleViewerData, createMockViewerData } from './viewerData';

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export async function getSchema(pathname = window.location.pathname): Promise<ViewerData> {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === '/') {
    return createEmptyViewerData();
  }

  if (normalizedPathname === '/mock') {
    return createMockViewerData();
  }

  if (normalizedPathname === '/xxx') {
    return createExampleViewerData();
  }

  return createEmptyViewerData();
}
