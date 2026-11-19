/**
 * Renders designs made from a template (values files) to PDF, the way `npx hyper-elements render` would where it can
 * draw a Document: each file is read and checked by its template, once per format it lists, and what the template
 * checked (its snapshot) is drawn with renderPdf(), with the fonts its root names.
 *
 *   out/designs/<name>.<format>.pdf, out/designs/<name>.<format>-page-N.png
 *
 *   npm run designs                          every designs/*.values.json
 *   npm run build -- designs/wr-4.values.json  one (build.tsx skips it: it isn't a .tsx)
 *
 * Exits 1 when a design has an error or a warning.
 */
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { formatDiagnostics } from "@hyper-elements/react";
import { renderPdf } from "@hyper-elements/react/pdf";
import { readValuesFile, type Template } from "@hyper-elements/react/template";
import { Font } from "@react-pdf/renderer";
import { fontsFor } from "./assets.ts";

// As in build.tsx: whole words in the PDF's narrow columns.
Font.registerHyphenationCallback((word: string) => [word]);

const outDir = resolve("out", "designs");
await mkdir(outDir, { recursive: true });
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
// `npm run build -- src/x.tsx` is for build.tsx, which ran first: here, only values files.
const files = args.length ? args.filter((a) => a.endsWith(".values.json")) : (await readdir("designs")).filter((f) => f.endsWith(".values.json")).map((f) => join("designs", f));

let failed = false;
for (const file of files) {
  const json = JSON.parse(await readFile(file, "utf8"));
  const template: Template<any, any> = (await import(pathToFileURL(resolve(dirname(file), json.template.module)).href)).default;
  const read = readValuesFile(json, template);
  const name = basename(file, ".values.json");
  if (!read.values) {
    console.log(`✗ ${file}\n${formatDiagnostics(read.diagnostics)}`);
    failed = true;
    continue;
  }
  for (const format of read.formats ?? []) {
    const checked = template.check(read.values, { format });
    const snapshot = checked.snapshots[format];
    if (!checked.valid || !snapshot) {
      console.log(`✗ ${file} [${format}]\n${formatDiagnostics(checked.diagnostics)}`);
      failed = true;
      continue;
    }
    const fonts = await fontsFor(template.design(read.values, { format }) as { props?: { fonts?: [] } });
    const { pdf, diagnostics } = await renderPdf(snapshot, { fonts });
    const all = [...checked.diagnostics, ...diagnostics];
    const bad = all.filter((d) => d.severity === "error" || d.severity === "warning");
    const target = join(outDir, `${name}.${format}.pdf`);
    await writeFile(target, pdf);
    try {
      execFileSync("pdftoppm", ["-png", "-r", "110", target, join(outDir, `${name}.${format}-page`)]);
    } catch {
      console.log("  (pdftoppm not found: the PDF's pages aren't written as images)");
    }
    console.log(`${bad.length ? "✗" : "✓"} ${file} [${format}] → out/designs/${name}.${format}.pdf: ${bad.length} errors and warnings, ${all.length - bad.length} notes`);
    if (bad.length) {
      console.log(formatDiagnostics(bad));
      failed = true;
    }
  }
}
process.exitCode = failed ? 1 : 0;
