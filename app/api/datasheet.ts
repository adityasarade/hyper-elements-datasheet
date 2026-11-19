import { ElementsError, render } from "@hyper-elements/react";
import template from "../../templates/datasheet";
import type { CheckResponse, FieldGuides, Paper, StudioDiagnostic } from "../contracts";

const MAX_BYTES = 96 * 1024;
const MAX_DEPTH = 12;
const MAX_ENTRIES = 4096;
const fields = template.describe().fields;

export function fieldGuides(): FieldGuides {
  return Object.fromEntries(fields.map(({ path, label, guidance, required, schema }) => [
    path,
    {
      label,
      guidance,
      required,
      maxLength: typeof schema.maxLength === "number" ? schema.maxLength : undefined,
      minItems: typeof schema.minItems === "number" ? schema.minItems : undefined,
      maxItems: typeof schema.maxItems === "number" ? schema.maxItems : undefined,
    },
  ]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function boundedJson(value: unknown): boolean {
  let entries = 0;
  function visit(item: unknown, depth: number): boolean {
    if (++entries > MAX_ENTRIES || depth > MAX_DEPTH) return false;
    if (Array.isArray(item)) return item.every((entry) => visit(entry, depth + 1));
    if (isRecord(item)) {
      return Object.entries(item).every(([key, entry]) =>
        !["__proto__", "constructor", "prototype"].includes(key) && visit(entry, depth + 1));
    }
    return typeof item !== "number" || Number.isFinite(item);
  }
  return visit(value, 0);
}

function emptyCheck(diagnostics: StudioDiagnostic[]): CheckResponse {
  return { valid: false, diagnostics, html: null, pages: 0 };
}

export function requestError(status: number, code: string, message: string) {
  return Response.json(
    emptyCheck([{ severity: "error", code, message, path: "request", field: null }]),
    { status },
  );
}

export async function readSubmission(request: Request): Promise<
  { values: Record<string, unknown>; format: Paper } | Response
> {
  const tooLarge = () => requestError(413, "request/size", "Use a request smaller than 96 KiB.");
  if (Number(request.headers.get("content-length")) > MAX_BYTES) return tooLarge();
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    return requestError(415, "request/content-type", "Send the values as application/json.");
  }
  if (!request.body) return requestError(400, "request/body", "Send a JSON request body.");

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let total = 0;
  let body = "";
  let input: unknown;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      total += chunk.value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel().catch(() => {});
        return tooLarge();
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    input = JSON.parse(body + decoder.decode());
  } catch {
    await reader.cancel().catch(() => {});
    return requestError(400, "request/json", "Send a valid UTF-8 JSON request.");
  } finally {
    reader.releaseLock();
  }

  if (
    !isRecord(input) || Object.keys(input).length !== 2 || !isRecord(input.values) ||
    (input.format !== "a4" && input.format !== "letter") || !boundedJson(input.values)
  ) {
    return requestError(400, "request/shape", "Send a values object and a paper format of a4 or letter.");
  }
  return { values: input.values, format: input.format };
}

function mapDiagnostic(diagnostic: Omit<StudioDiagnostic, "field" | "path"> & { path?: string }): StudioDiagnostic {
  const path = diagnostic.path ?? "root";
  const valuePath = path.startsWith("values.") ? path.slice(7) : "";
  let field = valuePath || null;
  let message = diagnostic.message;

  if (diagnostic.code === "template/render") {
    message = message.replace(/^wren\.Datasheet's render threw: /, "");
    if (/^\d+ pads on a .* pitch need an edge/.test(message)) field = "board.height";
    else if (message.startsWith("i2c.pullUpOhms and i2c.busCapacitancePf")) field = "i2c.pullUpOhms";
    else if (message.startsWith("revision:")) field = "revision";
    else field = message.match(/^(curves\[\d+\]\.points(?:\[\d+\]\.[a-z]+)?):/)?.[1] ?? field;
  }

  return { ...diagnostic, message, path, field };
}

export function checkDatasheet(values: unknown, format: Paper) {
  const checked = template.check(values, { format });
  return {
    valid: checked.valid,
    values: checked.values,
    template: checked.template,
    snapshot: checked.snapshots[format],
    diagnostics: checked.diagnostics.map(mapDiagnostic),
  };
}

export async function checkPreview(values: unknown, format: Paper): Promise<CheckResponse> {
  const checked = checkDatasheet(values, format);
  if (!checked.valid || !checked.snapshot) return emptyCheck(checked.diagnostics);
  try {
    const output = await render(checked.snapshot);
    const diagnostics = new Map<string, StudioDiagnostic>();
    for (const item of [...checked.diagnostics, ...output.diagnostics.map(mapDiagnostic)]) {
      diagnostics.set(JSON.stringify(item), item);
    }
    const pages = (output.html.match(/<section class="elements-page"(?=[\s>])/g) ?? []).length;
    return { valid: true, diagnostics: [...diagnostics.values()], html: output.html, pages };
  } catch (error) {
    if (error instanceof ElementsError) {
      return emptyCheck(error.diagnostics.map(mapDiagnostic));
    }
    throw error;
  }
}

export function refusedExport(diagnostics: StudioDiagnostic[]) {
  return Response.json(emptyCheck(diagnostics), { status: 422 });
}

export function exportError(error: unknown) {
  if (error instanceof ElementsError) return refusedExport(error.diagnostics.map(mapDiagnostic));
  console.error("Datasheet export failed", error);
  return requestError(500, "studio/export", "The download could not be prepared. Try again.");
}

export function safeFilenamePart(value: unknown): string {
  return typeof value === "string" ? value.replace(/[^A-Z0-9-]/gi, "") : "";
}
