import type { CategorySchema, RecordItem, SchemaColumn, ViewerData } from '../types';
import { createMockColumnRecords, createMockMessageRecords, createMockTableRecords } from './mockData';

const rowColumn: SchemaColumn = {
  label: 'Row',
  key: '__rowNumber',
  width: 72
};

const mockDelayMs = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function withRowColumn(category: CategorySchema): CategorySchema {
  return {
    ...category,
    columns: [rowColumn, ...category.columns]
  };
}

function createDelayedFetcher(recordsFactory: () => RecordItem[]): () => Promise<RecordItem[]> {
  return async () => {
    await sleep(mockDelayMs);
    return recordsFactory();
  };
}

export function createEmptyViewerData(): ViewerData {
  return [];
}

export function createMockViewerData(): ViewerData {
  return [
    withRowColumn({
      id: 'tables',
      categoryName: 'テーブル',
      fetchRecords: createDelayedFetcher(() => createMockTableRecords()),
      columns: [
        { label: 'サブシステム', key: 'subsystem', width: 160 },
        { label: '定義名', key: 'tableName', width: 220 },
        { label: '論理名', key: 'logicalName', width: 280 },
        { label: 'カラム数', key: 'columnCount', width: 120 }
      ],
      relations: [
        {
          name: 'Columns',
          targetCategoryId: 'columns',
          mappings: [
            {
              sourceKey: 'tableName',
              targetKey: 'tableName'
            }
          ]
        }
      ]
    }),
    withRowColumn({
      id: 'columns',
      categoryName: 'カラム',
      fetchRecords: createDelayedFetcher(() => createMockColumnRecords()),
      columns: [
        { label: 'テーブル定義名', key: 'tableName', width: 240 },
        { label: 'カラム定義名', key: 'columnName', width: 240 },
        { label: 'カラム論理名', key: 'logicalName', width: 280 }
      ],
      relations: [
        {
          name: 'Tables',
          targetCategoryId: 'tables',
          mappings: [
            {
              sourceKey: 'tableName',
              targetKey: 'tableName'
            }
          ]
        }
      ]
    }),
    withRowColumn({
      id: 'messages',
      categoryName: 'メッセージ',
      fetchRecords: createDelayedFetcher(() => createMockMessageRecords()),
      columns: [
        { label: 'キー', key: 'messageKey', width: 260 },
        { label: 'メッセージ', key: 'messageText', width: 420 },
        { label: 'ファイル', key: 'sourceFile', width: 220 }
      ],
      relations: []
    })
  ];
}

export function createExampleViewerData(_v?: string | null): ViewerData {
  return [
    withRowColumn({
      id: 'example',
      categoryName: 'Example',
      fetchRecords: createDelayedFetcher(() => [
        {
          type: 'Custom',
          name: 'Route /xxx',
          description: 'This is an example implementation for a custom URL.'
        },
        {
          type: 'Custom',
          name: 'Replace Me',
          description: 'You can replace this data source with any implementation you need.'
        }
      ]),
      columns: [
        { label: 'Type', key: 'type', width: 140 },
        { label: 'Name', key: 'name', width: 220 },
        { label: 'Description', key: 'description', width: 360 }
      ],
      relations: []
    })
  ];
}
