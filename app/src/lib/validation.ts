import type {
  CategoryRelation,
  CategoryRelationMapping,
  CategorySchema,
  RecordItem,
  SchemaColumn,
  ViewerData
} from '../types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateSchemaColumn(value: unknown, path: string): asserts value is SchemaColumn {
  if (!isPlainObject(value)) {
    throw new Error(`${path} must be an object.`);
  }

  if (!isString(value.label) || value.label.length === 0) {
    throw new Error(`${path}.label must be a non-empty string.`);
  }

  if (!isString(value.key) || value.key.length === 0) {
    throw new Error(`${path}.key must be a non-empty string.`);
  }

  if (!isNumber(value.width) || value.width <= 0) {
    throw new Error(`${path}.width must be a positive number.`);
  }
}

function validateRelationMapping(
  value: unknown,
  path: string
): asserts value is CategoryRelationMapping {
  if (!isPlainObject(value)) {
    throw new Error(`${path} must be an object.`);
  }

  if (!isString(value.sourceKey) || value.sourceKey.length === 0) {
    throw new Error(`${path}.sourceKey must be a non-empty string.`);
  }

  if (!isString(value.targetKey) || value.targetKey.length === 0) {
    throw new Error(`${path}.targetKey must be a non-empty string.`);
  }
}

function validateRelation(value: unknown, path: string): asserts value is CategoryRelation {
  if (!isPlainObject(value)) {
    throw new Error(`${path} must be an object.`);
  }

  if (!isString(value.name) || value.name.length === 0) {
    throw new Error(`${path}.name must be a non-empty string.`);
  }

  if (!isString(value.targetCategoryId) || value.targetCategoryId.length === 0) {
    throw new Error(`${path}.targetCategoryId must be a non-empty string.`);
  }

  if (!Array.isArray(value.mappings)) {
    throw new Error(`${path}.mappings must be an array.`);
  }

  value.mappings.forEach((mapping, index) => {
    validateRelationMapping(mapping, `${path}.mappings[${index}]`);
  });
}

function validateCategorySchema(
  value: unknown,
  path: string
): asserts value is CategorySchema {
  if (!isPlainObject(value)) {
    throw new Error(`${path} must be an object.`);
  }

  if (!isString(value.id) || value.id.length === 0) {
    throw new Error(`${path}.id must be a non-empty string.`);
  }

  if (!isString(value.categoryName) || value.categoryName.length === 0) {
    throw new Error(`${path}.categoryName must be a non-empty string.`);
  }

  if (typeof value.fetchRecords !== 'function') {
    throw new Error(`${path}.fetchRecords must be a function.`);
  }

  if (!Array.isArray(value.columns) || value.columns.length === 0) {
    throw new Error(`${path}.columns must be a non-empty array.`);
  }

  value.columns.forEach((column, index) => {
    validateSchemaColumn(column, `${path}.columns[${index}]`);
  });

  if (!Array.isArray(value.relations)) {
    throw new Error(`${path}.relations must be an array.`);
  }

  value.relations.forEach((relation, index) => {
    validateRelation(relation, `${path}.relations[${index}]`);
  });
}

export function validateViewerData(value: unknown): asserts value is ViewerData {
  if (!Array.isArray(value)) {
    throw new Error('Schema response must be an array.');
  }

  value.forEach((category, index) => {
    validateCategorySchema(category, `schema[${index}]`);
  });
}

export function validateRecords(
  category: CategorySchema,
  value: unknown
): asserts value is RecordItem[] {
  if (!Array.isArray(value)) {
    throw new Error(`Records for category "${category.id}" must be an array.`);
  }

  value.forEach((record, index) => {
    if (!isPlainObject(record)) {
      throw new Error(`records[${index}] for category "${category.id}" must be an object.`);
    }

    category.columns.forEach((column) => {
      if (column.key === '__rowNumber') {
        return;
      }

      if (!(column.key in record)) {
        throw new Error(
          `records[${index}] for category "${category.id}" is missing "${column.key}".`
        );
      }

      const cellValue = record[column.key];
      if (!(typeof cellValue === 'string' || typeof cellValue === 'number')) {
        throw new Error(
          `records[${index}].${column.key} for category "${category.id}" must be string or number.`
        );
      }
    });
  });
}
