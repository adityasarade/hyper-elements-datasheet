export type Paper = "a4" | "letter";

export type StudioDiagnostic = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  path: string;
  field: string | null;
};

export type CheckResponse = {
  valid: boolean;
  diagnostics: StudioDiagnostic[];
  html: string | null;
  pages: number;
};

export type FieldGuide = {
  label: string;
  guidance?: string;
  required: boolean;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
};

export type FieldGuides = Record<string, FieldGuide>;

export const paperLabels: Record<Paper, string> = { a4: "A4", letter: "Letter" };
