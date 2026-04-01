export type SchemaColumn = {
  label: string;
  key: string;
  width: number;
};

export type CategorySchema = {
  id: string;
  categoryName: string;
  fetchProgram: string;
  columns: SchemaColumn[];
};

export type RecordItem = Record<string, string | number>;

export type ViewerData = {
  schema: CategorySchema[];
  recordsByCategory: Record<string, RecordItem[]>;
};
