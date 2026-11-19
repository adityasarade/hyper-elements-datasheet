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
</style>`;

const stepFigures: Partial<Record<Step, string>> = {
  Pins: 'svg[aria-label*=" from above at "]',
  Board: 'svg[aria-label*=" outline at "]',
  "I²C bus": 'svg[aria-label^="I²C timing:"]',
};

export default function Preview({ sheet, destination, format, onFormat, checking, problems, stale, openChecks }: {
  sheet: PreviewSheet | null; destination: Destination; format: Paper; onFormat: (format: Paper) => void;
  checking: boolean; problems: number; stale: boolean; openChecks: () => void;
}) {
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

  const status = problems ? `${problems} ${problems === 1 ? "problem" : "problems"}` : checking ? "Checking…" : "Checked · 0 problems";
  const height = pageHeight || (sheet?.format === "letter" ? 1056 : 1122.52) * pages + Math.max(0, pages - 1) * 24;
  const activeTab = Math.min(selected, pages - 1);

  return (
    <section className="preview-panel" aria-label="Live preview">
      <div className="preview-controls" id="tour-preview">
        <div className="preview-heading">
          <h2>Live preview</h2>
          <button id="checks-trigger" type="button" className={`status-chip ${problems ? "has-problems" : checking ? "is-checking" : "is-clear"}`}
            aria-haspopup="dialog" onClick={openChecks}>
            {problems || checking ? <span className="status-dot" aria-hidden="true" /> : <Icon name="check" />}
            <span aria-live="polite">{status}</span>
            <Icon name="chevron" />
          </button>
        </div>
        <div className="preview-toolbar">
          <div className="page-controls">
            {pages > 0 && <div role="tablist" aria-label="Datasheet pages" className="page-tabs">
              {Array.from({ length: pages }, (_, index) => (
                <button key={index} id={`page-tab-${index}`} type="button" role="tab" aria-selected={index === activeTab}
                  aria-controls="preview-pages" aria-label={`Page ${index + 1} of ${pages}`} tabIndex={index === activeTab ? 0 : -1}
                  onClick={() => choosePage(index)} onKeyDown={(event) => tabKeys(event, index)}>
                  {index + 1}
                </button>
              ))}
            </div>}
          </div>
          <PaperSize format={format} onChange={onFormat} label="Preview paper size" />
        </div>
      </div>
      <div ref={viewport} className="preview-viewport" id="preview-pages"
        role={pages > 0 ? "tabpanel" : undefined} aria-labelledby={pages > 0 ? `page-tab-${activeTab}` : undefined} aria-busy={checking}
        tabIndex={0} onScroll={onScroll}>
        <div className="preview-lane" ref={lane}>
          {source && available > 0 ? (
            <div className={`preview-paper ${stale ? "stale" : ""}`} style={{ width: width * scale, height: height * scale }}>
              <iframe ref={frame} srcDoc={source} sandbox="allow-same-origin" title="Print preview of the datasheet"
                tabIndex={-1} onLoad={() => setLoaded((current) => current + 1)}
                style={{ width, height, transform: `scale(${scale})` }} />
            </div>
          ) : (
            <div className="preview-placeholder">{checking ? "Checking the datasheet…" : "A checked datasheet will appear here."}</div>
          )}
        </div>
      </div>
      <div className="preview-footer">
        <span>{pages > 0 ? `Page ${activeTab + 1} of ${pages}` : "No pages"}{sheet && ` · ${paperLabels[sheet.format]}`}</span>
        <span role="status">{checking ? "Updating…" : stale && sheet ? "Showing the last checked preview" : ""}</span>
      </div>
    </section>
  );
}
