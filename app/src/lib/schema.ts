import type { CategoryRelation, SchemaColumn, ViewerData } from '../types';
import { createEmptyViewerData, createExampleViewerData, createMockViewerData } from './viewerData';

type HashRoute = {
  pathname: string;
  search: string;
};

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

function parseHashRoute(hash = window.location.hash): HashRoute {
  if (!hash || hash === '#') {
    return {
      pathname: '/',
      search: ''
    };
  }

  const hashValue = hash.startsWith('#') ? hash.slice(1) : hash;
  const [pathnamePart, searchPart = ''] = hashValue.split('?');

  return {
    pathname: normalizePathname(pathnamePart || '/'),
    search: searchPart ? `?${searchPart}` : ''
  };
}

export async function getSchema(
  hash = window.location.hash
): Promise<ViewerData> {
  const { pathname, search } = parseHashRoute(hash);
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === '/') {
    return createEmptyViewerData();
  }

  if (normalizedPathname === '/mock') {
    return createMockViewerData();
  }

  if (normalizedPathname === '/refer') {
  const url = (import.meta as any).env.VITE_API_URL;
  console.log(url);
    const schema = getQueryParamValue('schema', search);
    const db = getQueryParamValue('db', search);

    if (schema == null || db == null) throw new Error('クエリパラメータが正しくありません。');
    return readSchemaDetail(schema, db);
  }

  return createEmptyViewerData();
}

const readSchemaDetail = async (schemaFile: string, dbFile: string): Promise<ViewerData> => {

  const res = await fetch('http://localhost:1209/getFile', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path: `schema/${schemaFile}`
    })
  });

  const def: SchemaDef = JSON.parse(await res.json());

  const schema = def.categories.map(cat => {
    return {
      ...cat,
      fetchRecords: async () => {
        return getQueryResult(dbFile, cat.query)
      }
    }
  });
  console.log(schema);
  return schema;
}

const readSchema = async (fileName: string): Promise<ViewerData> => {

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