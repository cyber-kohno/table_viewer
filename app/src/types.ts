export type SchemaColumn = {
  label: string;
  key: string;
  width: number;
};

export type RecordItem = Record<string, string | number>;

export type CategoryRelationMapping = {
  sourceKey: string;
  targetKey: string;
};

export type CategoryRelation = {
  name: string;
  targetCategoryId: string;
  mappings: CategoryRelationMapping[];
};

export type CategorySchema = {
  id: string;
  categoryName: string;
  fetchRecords: () => Promise<RecordItem[]>;
  columns: SchemaColumn[];
  relations: CategoryRelation[];
};

export type ViewerData = CategorySchema[];
