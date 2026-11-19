"use client";

import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { paperLabels, type Paper } from "./contracts";
import type { Step } from "./draft";
import { PaperSize } from "./editor";
import { Icon } from "./icons";

export type PreviewSheet = { html: string; pages: number; format: Paper };
export type Destination = { step: Step };

const previewHead = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src https://fonts.gstatic.com; base-uri 'none'; form-action 'none'"><style>
  html, body { background: transparent !important; padding: 0 !important; margin: 0 !important; overflow: hidden; }
  main { display: flow-root; }
  .elements-page { box-shadow: none !important; }
  .studio-flash { outline: 2px solid #a9471f; outline-offset: 5px; border-radius: 2px; animation: studio-flash 1.8s ease-out forwards; }
  @keyframes studio-flash { 0%, 45% { outline-color: rgba(169,71,31,1); } 100% { outline-color: rgba(169,71,31,0); } }
  @media (prefers-reduced-motion: reduce) { .studio-flash { animation: none; outline: none; } }
</style>`;

/** What a change in each step redraws: marked for a moment after the new datasheet arrives. */
const redraws: Partial<Record<Step, (document: Document) => Element[]>> = {
  Start: (document) => [...figures(document, ['svg[aria-label*=" from above at "]', 'svg[aria-label^="A typical application"]']), ...pinTable(document)],
  Pins: (document) => [...figures(document, ['svg[aria-label*=" from above at "]', 'svg[aria-label^="A typical application"]', 'svg[aria-label*=" outline at "]']), ...pinTable(document)],
  Board: (document) => figures(document, ['svg[aria-label*=" from above at "]', 'svg[aria-label*=" outline at "]']),
  "I²C bus": (document) => figures(document, ['svg[aria-label^="I²C timing:"]', 'svg[aria-label^="A typical application"]']),
};

function figures(document: Document, selectors: string[]) {
  return selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
}

/** The pin table: the one whose header names a type column. */
function pinTable(document: Document) {
  return Array.from(document.querySelectorAll("table")).filter((table) => /\btype\b/i.test(table.rows[0]?.textContent ?? "")).slice(0, 1);
}

const stepFigures: Partial<Record<Step, string>> = {
  Pins: 'svg[aria-label*=" from above at "]',
  Board: 'svg[aria-label*=" outline at "]',
  "I²C bus": 'svg[aria-label^="I²C timing:"]',
};

export default function Preview({ sheet, destination, format, onFormat, checking, problems, stale, openChecks, pulse }: {
  sheet: PreviewSheet | null; destination: Destination; format: Paper; onFormat: (format: Paper) => void;
  checking: boolean; problems: number; stale: boolean; openChecks: () => void; pulse: number;
}) {
  const flashed = useRef(pulse);
  const frame = useRef<HTMLIFrameElement>(null);
  const lane = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const offsets = useRef<number[]>([]);
  const [available, setAvailable] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [selected, setSelected] = useState(0);
  const [choice, setChoice] = useState<{ destination: Destination; page: number } | null>(null);
  const [loaded, setLoaded] = useState(0);

  const source = useMemo(() => sheet?.html.replace("<head>", "<head>" + previewHead), [sheet]);
  const width = sheet?.format === "letter" ? 816 : 793.7;
  const scale = available > 0 ? Math.min(1, available / width) : 1;
  const pages = sheet?.pages ?? 0;
  const chosenPage = choice?.destination === destination ? Math.min(choice.page, Math.max(0, pages - 1)) : null;

  useLayoutEffect(() => {
    const element = lane.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const document = frame.current?.contentDocument;
    if (!document?.body || !sheet || available <= 0) return;

    function position() {
      const paper = Array.from(document!.querySelectorAll<HTMLElement>(".elements-page"));
      if (!paper.length) return;
      const height = document!.querySelector("main")?.getBoundingClientRect().height ?? 0;
      setPageHeight(height);
      offsets.current = paper.map((section) => section.getBoundingClientRect().top * scale);

      const selector = stepFigures[destination.step];
      const figure = chosenPage === null && selector ? document!.querySelector(selector) : null;
      const figureSection = figure?.closest<HTMLElement>(".elements-page");
      const index = chosenPage ?? (figureSection ? paper.indexOf(figureSection) : 0);
      const offset = figure && destination.step === "Pins" ? Math.max(0, figure.getBoundingClientRect().top * scale - 16) : offsets.current[index];
      setSelected(index);
      viewport.current?.scrollTo({ top: offset });
    }

    let animation = 0;
    const schedule = () => {
      cancelAnimationFrame(animation);
      animation = requestAnimationFrame(position);
    };
    // Wait for the sheet height and the viewport width to reach the DOM before scrolling.
    schedule();
    let active = true;
    void document.fonts.ready.then(() => { if (active) schedule(); });
    return () => { active = false; cancelAnimationFrame(animation); };
  }, [available, chosenPage, destination, loaded, pageHeight, scale, sheet]);

  // Once the redrawn datasheet has loaded, mark what the change redrew: once per checked redraw.
  useLayoutEffect(() => {
    const document = frame.current?.contentDocument;
    if (!document?.body || flashed.current === pulse) return;
    flashed.current = pulse;
    for (const element of redraws[destination.step]?.(document) ?? []) element.classList.add("studio-flash");
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  function onScroll() {
    const element = viewport.current;
    if (!element || offsets.current.length < 2) return;
    const top = element.scrollTop;
    const last = offsets.current.length - 1;
    const bottom = top > 0 && top + element.clientHeight >= element.scrollHeight - 2;
    const next = offsets.current.findIndex((offset) => offset > top + 32);
    setSelected(bottom || next === -1 ? last : Math.max(0, next - 1));
  }

  function choosePage(index: number) {
    setSelected(index);
    setChoice({ destination, page: index });
    // A second click on the active tab goes back to the top of that page.
    if (choice?.destination === destination && choice.page === index) {
      viewport.current?.scrollTo({ top: offsets.current[index] ?? 0 });
    }
  }

  function tabKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowRight": next = (index + 1) % pages; break;
      case "ArrowLeft": next = (index + pages - 1) % pages; break;
      case "Home": next = 0; break;
      case "End": next = pages - 1; break;
      default: return;
    }
    event.preventDefault();
    choosePage(next);
    document.getElementById(`page-tab-${next}`)?.focus();
  }

  const status = problems ? `${problems} ${problems === 1 ? "problem" : "problems"} to fix` : checking ? "Checking" : "Checked, no problems";
  const height = pageHeight || (sheet?.format === "letter" ? 1056 : 1122.52) * pages + Math.max(0, pages - 1) * 24;
  const activeTab = Math.min(selected, pages - 1);

  return (
    <section className="preview-panel" aria-labelledby="preview-title">
      <h2 id="preview-title" className="visually-hidden">Live datasheet</h2>
      <div className="preview-controls" id="tour-preview">
        <div className="sheet-tabs">
          <span className="sheet-label" id="sheet-label">Sheet</span>
          {pages > 0 && <div role="tablist" aria-labelledby="sheet-label" className="page-tabs">
            {Array.from({ length: pages }, (_, index) => (
              <button key={index} id={`page-tab-${index}`} type="button" role="tab" aria-selected={index === activeTab}
                aria-controls="preview-pages" aria-label={`Sheet ${index + 1} of ${pages}`} tabIndex={index === activeTab ? 0 : -1}
                onClick={() => choosePage(index)} onKeyDown={(event) => tabKeys(event, index)}>
                {index + 1}
              </button>
            ))}
          </div>}
        </div>
        <div className="preview-tools">
          <PaperSize format={format} onChange={onFormat} label="Paper size" />
          <button id="checks-trigger" type="button" className={`status-chip ${problems ? "has-problems" : checking ? "is-checking" : "is-clear"}`}
            aria-haspopup="dialog" onClick={openChecks}>
            {problems || checking ? <span className="status-dot" aria-hidden="true" /> : <Icon name="check" />}
            <span aria-live="polite">{status}</span>
          </button>
        </div>
      </div>
      <div ref={viewport} className="preview-viewport" id="preview-pages"
        role={pages > 0 ? "tabpanel" : undefined} aria-labelledby={pages > 0 ? `page-tab-${activeTab}` : undefined} aria-busy={checking}
        tabIndex={0} onScroll={onScroll}>
        {stale && sheet && <p className="stale-note" role="status">Showing the last version that passed. Fix the {problems === 1 ? "problem" : "problems"} to update it.</p>}
        <div className="preview-lane" ref={lane}>
          {source && available > 0 ? (
            <div className={`preview-paper ${stale ? "stale" : ""}`} style={{ width: width * scale, height: height * scale }}>
              <iframe ref={frame} srcDoc={source} sandbox="allow-same-origin" title={`Print preview of the datasheet, ${paperLabels[sheet!.format]}`}
                tabIndex={-1} onLoad={() => setLoaded((current) => current + 1)}
                style={{ width, height, transform: `scale(${scale})` }} />
            </div>
          ) : (
            <div className="preview-placeholder">{checking ? "Checking the datasheet" : "The checked datasheet appears here."}</div>
          )}
        </div>
      </div>
    </section>
  );
}
