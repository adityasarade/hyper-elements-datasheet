import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { checkDatasheet, exportError, readSubmission, refusedExport, safeFilenamePart } from "../datasheet";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const submission = await readSubmission(request);
  if (submission instanceof Response) return submission;

  try {
    const { values, format } = submission;
    const checked = checkDatasheet(values, format);
    if (!checked.valid || !checked.snapshot) return refusedExport(checked.diagnostics);

    const source = await readFile(join(process.cwd(), "templates", "datasheet.tsx"));
    const file = {
      version: 1,
      template: {
        module: "../templates/datasheet.tsx",
        ...checked.template,
        sha256: createHash("sha256").update(source).digest("hex"),
      },
      formats: [format],
      values: checked.values,
    };
    const part = safeFilenamePart(values.part).toLowerCase();
    return new Response(JSON.stringify(file, null, 2) + "\n", {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${part}.values.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return exportError(error);
  }
}
