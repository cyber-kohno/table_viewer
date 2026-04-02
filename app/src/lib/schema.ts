import type { ViewerData } from '../types';
import { createEmptyViewerData, createExampleViewerData, createMockViewerData } from './viewerData';

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function getQueryParamValue(key: string, search = window.location.search): string | null {
  const searchParams = new URLSearchParams(search);
  return searchParams.get(key);
}

export async function getSchema(
  pathname = window.location.pathname,
  search = window.location.search
): Promise<ViewerData> {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === '/') {
    return createEmptyViewerData();
  }

  if (normalizedPathname === '/mock') {
    return createMockViewerData();
  }

  if (normalizedPathname === '/xxx') {
    const v = getQueryParamValue('v', search);
    return createExampleViewerData(v);
  }

  return createEmptyViewerData();
}
