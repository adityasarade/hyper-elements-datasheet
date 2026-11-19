import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderPdf } from "@hyper-elements/react/pdf";
import { Font } from "@react-pdf/renderer";
import { paperLabels } from "../../contracts";
import { checkDatasheet, exportError, readSubmission, refusedExport, safeFilenamePart } from "../datasheet";

export const runtime = "nodejs";

Font.registerHyphenationCallback((word: string) => [word]);

const fontFamilies = [
  { family: "Barlow", weights: [300, 400, 500, 600] },
  { family: "Chivo Mono", weights: [400, 500, 600, 700] },
];

function readFonts() {
  return Promise.all(fontFamilies.flatMap(({ family, weights }) => weights.map(async (weight) => ({
    family,
    weight,
    src: await readFile(join(process.cwd(), "fonts", `${family.replaceAll(" ", "-")}-${weight}.ttf`)),
  }))));
}

let fontBytes: ReturnType<typeof readFonts> | undefined;

export async function POST(request: Request) {
  const submission = await readSubmission(request);
  if (submission instanceof Response) return submission;

  try {
    const { values, format } = submission;
    const checked = checkDatasheet(values, format);
    if (!checked.valid || !checked.snapshot) return refusedExport(checked.diagnostics);

    fontBytes ??= readFonts().catch((error) => {
      fontBytes = undefined;
      throw error;
    });
    const { pdf } = await renderPdf(checked.snapshot, { fonts: await fontBytes });
    const part = safeFilenamePart(values.part);
    const revision = safeFilenamePart(values.revision);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${part}-Rev${revision}-${paperLabels[format]}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return exportError(error);
  }
}
