import schemaJson from '../schema.json';
import type { CategorySchema, SchemaColumn, ViewerData } from '../types';
import { createMockColumnRecords, createMockMessageRecords, createMockTableRecords } from './mockData';

const rowColumn: SchemaColumn = {
  label: 'Row',
  key: '__rowNumber',
  width: 72
};

const baseSchema = schemaJson as CategorySchema[];

export function createEmptyViewerData(): ViewerData {
  return {
    schema: [],
    recordsByCategory: {}
  };
}

export function createSchemaWithRowColumn(schema: CategorySchema[]): CategorySchema[] {
  return schema.map((category) => ({
    ...category,
    columns: [rowColumn, ...category.columns]
  }));
}

export function createMockViewerData(): ViewerData {
  return {
    schema: createSchemaWithRowColumn(baseSchema),
    recordsByCategory: {
      tables: createMockTableRecords(),
      columns: createMockColumnRecords(),
      messages: createMockMessageRecords()
    }
  };
}

export function createExampleViewerData(): ViewerData {
  const schema = createSchemaWithRowColumn([
    {
      id: 'example',
      categoryName: 'Example',
      fetchProgram: 'exampleFetch',
      columns: [
        { label: 'Type', key: 'type', width: 140 },
        { label: 'Name', key: 'name', width: 220 },
        { label: 'Description', key: 'description', width: 360 }
      ]
    }
  ]);

  return {
    schema,
    recordsByCategory: {
      example: [
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
      ]
    }
  };
}
