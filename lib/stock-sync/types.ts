export type CellValue = string | number | boolean | Date | null;

export type InventoryImportRow = {
  brand: string;
  model: string;
  configuration: string | null;
  external_id: string;
  serial_number: string;
  production_year: number | null;
  arrival_date: string | null;
  location: string;
  status: "in_stock" | "in_transit" | "in_production";
  status_priority: number;
  contract_currency: string | null;
  price_with_vat: number | null;
  specification: string | null;
  warranty: string | null;
};

export type SpotImportRow = {
  external_id: string;
  brand: string;
  type: string | null;
  model: string;
  production_year: number | null;
  status: string;
  contract_currency: string | null;
  price_with_vat: number | null;
  delivery_terms: string | null;
  delivery: string | null;
  specification: string | null;
};

export type WorkbookSheet = {
  sheet: string;
  data: CellValue[][];
};

export type TransformIssue = {
  sheet: string;
  row: number;
  message: string;
};

export type TransformResult = {
  inventory: InventoryImportRow[];
  spot: SpotImportRow[];
  issues: TransformIssue[];
};

export type BrandResolver = {
  bySerial: Map<string, string>;
  byModel: Map<string, string>;
};
