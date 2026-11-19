"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CheckResponse, FieldGuides, Paper, StudioDiagnostic } from "./contracts";
import { Checks, Tour, Welcome } from "./dialogs";
import { assemble, focusField, makeDraft, makeSubmission, readSavedDraft, stepFor, steps, type Draft, type Example, type Step } from "./draft";
import { StepFields, stepGuidance, type ExportKind } from "./editor";
import { Icon, WrenMark } from "./icons";
import Preview, { type Destination, type PreviewSheet } from "./preview";

const draftKey = "wren-datasheet-studio-draft-v1";
const welcomeKey = "wren-datasheet-studio-welcome-v1";
const debounceMs = 350;
type Pane = "edit" | "preview";
type Overlay = "welcome" | "tour" | "checks" | null;

function stepId(step: Step) {
  return `step-${steps.indexOf(step) + 1}`;
}

function previewSheet(result: CheckResponse, format: Paper): PreviewSheet | null {
  return result.valid && result.html && result.pages ? { html: result.html, pages: result.pages, format } : null;
}

function networkError(): CheckResponse {
  return {
    valid: false,
    html: null,
    pages: 0,
    diagnostics: [{
      severity: "error", code: "studio/network", message: "The studio could not reach the checker. Try again.", path: "request", field: null,
    }],
  };
}

export default function Studio({ initial, guides }: { initial: CheckResponse; guides: FieldGuides }) {
  const baseline = useMemo(() => {
    const draft = makeDraft("WR-2");
    const assembled = assemble(draft);
    if ("error" in assembled) throw new Error(assembled.error);
    return { draft, body: makeSubmission(assembled.values, "a4"), sheet: previewSheet(initial, "a4") };
  }, [initial]);
  const [draft, setDraft] = useState(baseline.draft);
  const [example, setExample] = useState<Example>("WR-2");
  const [format, setFormat] = useState<Paper>("a4");
  const [pane, setPane] = useState<Pane>("edit");
  const [destination, setDestination] = useState<Destination>({ step: "Start" });
  const step = destination.step;
  const [visited, setVisited] = useState<Step[]>([]);
  const [ready, setReady] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [tour, setTour] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [lastGood, setLastGood] = useState(baseline.sheet);
  const [result, setResult] = useState({ body: baseline.body, response: initial });
  const [retry, setRetry] = useState(0);
  // Counts the checked redraws a change caused, so the preview can mark what redrew.
  const [pulse, setPulse] = useState(0);
  const focusFrame = useRef(0);
  const tourOrigin = useRef<{ destination: Destination; pane: Pane; focus: string }>(null);

  const assembled = useMemo(() => assemble(draft), [draft]);
  const body = "values" in assembled ? makeSubmission(assembled.values, format) : null;
  const current = result.body === body ? result.response : null;
  const checking = body !== null && current === null;
  const diagnostics: StudioDiagnostic[] = "error" in assembled ? [{
    severity: "error", code: "studio/json", field: "advanced", path: "advanced", message: assembled.error,
  }] : current?.diagnostics ?? [];
  const problems = diagnostics.filter(({ severity }) => severity !== "info");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      const saved = raw && readSavedDraft(raw);
      if (saved) {
        setDraft(saved.draft);
        setExample(saved.example);
        setFormat(saved.format);
      }
    } catch {
      // A blocked or unreadable store leaves the starting example usable.
    }
    let showWelcome = true;
    try { showWelcome = localStorage.getItem(welcomeKey) !== "seen"; } catch {}
    if (showWelcome) setOverlay("welcome");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ draft, example, format })); } catch {}
  }, [draft, example, format, ready]);

  useEffect(() => {
    if (!body) return;
    if (body === baseline.body) {
      setResult({ body, response: initial });
      setLastGood(baseline.sheet);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/check", {
          method: "POST", headers: { "Content-Type": "application/json" }, body, signal: controller.signal,
        });
        const checked: CheckResponse = await response.json();
        if (controller.signal.aborted) return;
        setResult({ body, response: checked });
        const sheet = previewSheet(checked, format);
        if (sheet) {
          setLastGood(sheet);
          setPulse((count) => count + 1);
        }
      } catch {
        if (!controller.signal.aborted) setResult({ body, response: networkError() });
      }
    }, debounceMs);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [baseline, body, format, initial, retry]);

  useEffect(() => () => cancelAnimationFrame(focusFrame.current), []);

  function focus(id: string, fallback?: string) {
    cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      let target = document.getElementById(id);
      if (!target || target.matches(":disabled") || target.getClientRects().length === 0) {
        target = fallback ? document.getElementById(fallback) : null;
      }
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  function openStep(next: Step, focusHeading = false) {
    if (steps.indexOf(next) > steps.indexOf(step)) {
      setVisited((previous) => previous.includes(step) ? previous : [...previous, step]);
    }
    setDestination({ step: next });
    setPane("edit");
    if (focusHeading) focus(stepId(next));
  }

  function loadExample(key: Example) {
    setExample(key);
    setDraft(makeDraft(key));
    setVisited([]);
    setAdvancedOpen(false);
    setDownloadMessage("");
    setDestination({ step: "Start" });
  }

  function dismissWelcome() {
    try { localStorage.setItem(welcomeKey, "seen"); } catch {}
  }

  function startTour(fromWelcome: boolean) {
    if (fromWelcome) dismissWelcome();
    tourOrigin.current = { destination, pane, focus: fromWelcome ? stepId(step) : "how-it-works" };
    goTour(0);
    setOverlay("tour");
  }

  function goTour(index: number) {
    setTour(index);
    setDestination({ step: index === 1 ? "Pins" : index === 3 ? "Export" : "Start" });
    setPane(index === 2 ? "preview" : "edit");
  }

  function closeOverlay() {
    setOverlay(null);
    if (overlay === "welcome") {
      dismissWelcome();
      focus(stepId(step));
    } else if (overlay === "tour" && tourOrigin.current) {
      const origin = tourOrigin.current;
      setDestination(origin.destination);
      setPane(origin.pane);
      focus(origin.focus, "how-it-works");
    } else if (overlay === "checks") {
      focus("checks-trigger");
    }
  }

  function goToField(field: string | null) {
    setOverlay(null);
    const target = stepFor(field);
    const input = focusField(field);
    openStep(target);
    if (input === "advanced") setAdvancedOpen(true);
    focus(input, field?.startsWith("pins[") ? "pins" : stepId(target));
  }

  async function download(kind: ExportKind) {
    if (!body || !current?.valid || exporting) return;
    setExporting(kind);
    setDownloadMessage("");
    try {
      const response = await fetch(`/api/${kind}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body,
      });
      if (!response.ok) {
        const failure: CheckResponse = await response.json();
        const text = failure.diagnostics.find(({ severity }) => severity === "error")?.message;
        throw new Error(text ?? "The download could not be prepared.");
      }
      const link = document.createElement("a");
      const url = URL.createObjectURL(await response.blob());
      link.href = url;
      link.download = response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ??
        (kind === "pdf" ? "datasheet.pdf" : "datasheet.values.json");
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      setDownloadMessage(error instanceof Error ? error.message : "The download could not be prepared.");
    } finally {
      setExporting(null);
    }
  }

  function change(patch: Partial<Draft>) {
    setDraft((previous) => ({ ...previous, ...patch }));
    setDownloadMessage("");
  }

  return (
    <>
      <header className="studio-header">
        <div className="header-inner">
          <div className="brand"><WrenMark /><h1>Datasheet studio</h1></div>
          <p className="document-id" aria-label="Datasheet being edited">
            <strong>{draft.part || "Untitled"}</strong>
            <span>{draft.name}{draft.revision ? `, revision ${draft.revision}` : ""}</span>
          </p>
          <div className="header-actions">
            <button type="button" className="button button-quiet how-button" id="how-it-works" aria-haspopup="dialog"
              onClick={() => startTour(false)}><Icon name="help" /><span>How it works</span></button>
            <button type="button" className="button button-primary" aria-disabled={!current?.valid || !!exporting}
              title={current?.valid ? undefined : "Fix the problems the checker found to download"}
              onClick={() => { if (current?.valid && !exporting) download("pdf"); }}>
              <Icon name="download" /> {exporting === "pdf" ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        </div>
      </header>
      <main className="workspace" data-pane={pane}>
        <div className="mobile-views segmented" role="group" aria-label="Workspace view">
          <button type="button" aria-pressed={pane === "edit"} onClick={() => setPane("edit")}>Edit</button>
          <button type="button" aria-pressed={pane === "preview"} onClick={() => setPane("preview")}>Preview</button>
        </div>
        <section className="editor-panel" aria-labelledby="editor-title" id="tour-steps">
          <h2 id="editor-title" className="visually-hidden">Edit the datasheet, step by step</h2>
          <ol className="stepper" aria-label="Datasheet editing steps">
            {steps.map((item, index) => {
              const active = item === step;
              const count = problems.filter(({ field }) => stepFor(field) === item).length;
              const complete = !active && !count && visited.includes(item);
              const id = stepId(item);
              return (
                <li key={item} className={active ? "step active" : "step"}>
                  <h3>
                    <button id={id} type="button" className="step-trigger" aria-current={active ? "step" : undefined}
                      aria-controls={`${id}-fields`} aria-expanded={active} onClick={() => openStep(item)}>
                      <span className={`step-number ${complete ? "complete" : ""}`} aria-hidden="true">{complete ? <Icon name="check" /> : index + 1}</span>
                      <span>{item}</span>
                      {complete && <span className="visually-hidden"> completed</span>}
                      {count > 0 && <span className="step-problems"><i aria-hidden="true" />{count}<span className="visually-hidden"> {count === 1 ? "problem" : "problems"}</span></span>}
                      <Icon name="chevron" />
                    </button>
                  </h3>
                  <div id={`${id}-fields`} hidden={!active}>
                    {active && <div className="step-body">
                      <p className="step-guidance" id={item === "Export" ? "export-heading" : undefined}
                        tabIndex={item === "Export" ? -1 : undefined}>{stepGuidance(item, guides)}</p>
                      {item === "Export" && problems.some(({ field }) => field === null) && (
                        <ul className="field-problems">
                          {problems.filter(({ field }) => field === null).map(({ message }, index) => <li key={index}>{message}</li>)}
                        </ul>
                      )}
                      <StepFields step={item} context={{ guides, diagnostics }} draft={draft} change={change} example={example}
                        choose={(part) => { if (part !== example) loadExample(part); }} reset={() => loadExample(example)}
                        focus={focus} format={format} setFormat={setFormat} advancedOpen={advancedOpen} setAdvancedOpen={setAdvancedOpen}
                        canExport={!!current?.valid} download={download} exporting={exporting} downloadMessage={downloadMessage} />
                      {item !== "Export" && <div className="step-navigation">
                        <button type="button" className="button button-primary" onClick={() => openStep(steps[index + 1], true)}>
                          Next: {steps[index + 1]}
                        </button>
                      </div>}
                    </div>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
        <Preview sheet={lastGood} destination={destination} format={format} onFormat={setFormat} pulse={pulse}
          checking={checking} problems={problems.length} stale={"error" in assembled || current?.valid === false} openChecks={() => setOverlay("checks")} />
      </main>
      {overlay === "welcome" && <Welcome beginTour={() => startTour(true)} close={closeOverlay} />}
      {overlay === "tour" && <Tour index={tour} setIndex={goTour} close={closeOverlay} />}
      {overlay === "checks" && <Checks diagnostics={diagnostics} guides={guides} checking={checking}
        close={closeOverlay} go={goToField} retry={diagnostics.some((item) => item.code === "studio/check" || item.code === "studio/network") ? () => {
          setResult({ body: "", response: initial });
          setRetry((attempt) => attempt + 1);
        } : undefined} />}
    </>
  );
}
