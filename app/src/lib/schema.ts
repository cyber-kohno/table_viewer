import type { CategoryRelation, SchemaColumn, ViewerData } from '../types';
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
    // const v = getQueryParamValue('v', search);
    // return createExampleViewerData(v); 

    return getSchemaFile('test.json');
  }

  return createEmptyViewerData();
}

const getSchemaFile = async (fileName: string): Promise<ViewerData> => {

  const res = await fetch('http://localhost:1209/getFile', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path: `schema/${fileName}`
    })
  });

  const def: SchemaDef = JSON.parse(await res.json());

  const schema = def.categories.map(cat => {
    return {
      ...cat,
      fetchRecords: async () => {
        return getQueryResult(def.dbFile, cat.query)
      }
    }
  });
  console.log(schema);
  return schema;
}

const getQueryResult = async (dbName: string, query: string) => {

  const res = await fetch('http://localhost:1209/select', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: dbName,
      sql: query
    })
  });
  return res.json();
}

type SchemaDef = {
  dbFile: string;
  categories: {
    id: string;
    categoryName: string;
    columns: SchemaColumn[];
    relations: CategoryRelation[];
    query: string;
  }[];
}