"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { FieldGuides, StudioDiagnostic } from "./contracts";
import { Icon } from "./icons";

function Dialog({ titleId, className, close, children }: { titleId: string; className: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-focus]")?.focus({ preventScroll: true });
    return () => { dialog.close(); };
  }, []);

  return (
    <dialog ref={ref} className={className} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); close(); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
        const target = event.shiftKey ? buttons.at(-1) : buttons[0];
        const boundary = event.shiftKey ? buttons[0] : buttons.at(-1);
        if (target && (document.activeElement === boundary || !buttons.includes(document.activeElement as HTMLButtonElement))) {
          event.preventDefault();
          target.focus();
        }
      }}>
      {children}
    </dialog>
  );
}

export function Welcome({ beginTour, close }: { beginTour: () => void; close: () => void }) {
  return (
    <Dialog titleId="welcome-title" className="welcome-dialog" close={close}>
      <h2 id="welcome-title">Make a sensor datasheet from data</h2>
      <ul className="welcome-list">
        <li>Edit values on the left.</li>
        <li>The datasheet redraws on the right, with every drawing made from your data.</li>
        <li>Download the PDF when you’re ready.</li>
      </ul>
      <div className="dialog-actions">
        <button className="button button-primary" type="button" onClick={beginTour} data-focus>Take the 30-second tour <Icon name="arrow" /></button>
        <button className="button button-secondary" type="button" onClick={close}>Skip</button>
      </div>
    </Dialog>
  );
}

export const tourStops = [
  { id: "tour-steps", title: "Work through the steps", description: "Choose an example and work through the steps to edit its data." },
  { id: "tour-pins", title: "Edit the pin list", description: "Change a pin here and the board drawing, pin table and schematic all update together." },
  { id: "tour-preview", title: "Check the preview", description: "Use the page tabs to inspect the datasheet and open Checks to find any problems." },
  { id: "tour-download", title: "Download your datasheet", description: "Download a PDF in the paper size you chose." },
] as const;

type Bounds = { top: number; left: number; width: number; height: number };

export function Tour({ index, setIndex, close }: { index: number; setIndex: (index: number) => void; close: () => void }) {
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<Bounds | null>(null);
  const [cardStyle, setCardStyle] = useState<CSSProperties>();
  const stop = tourStops[index];
  const last = index === tourStops.length - 1;

  useLayoutEffect(() => {
    const element = document.getElementById(stop.id);
    element?.scrollIntoView({ block: "start", inline: "nearest" });
    next.current?.focus({ preventScroll: true });

    function place() {
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const rect = element?.getBoundingClientRect();
      const inset = 10;
      const pad = 5;
      const width = Math.min(320, viewportWidth - 2 * inset);
      const height = card.current?.offsetHeight ?? 175;
      if (!rect || !rect.width || rect.bottom < inset || rect.top > viewportHeight - inset) {
        setAnchor(null);
        setCardStyle({ width, left: (viewportWidth - width) / 2, top: Math.max(inset, (viewportHeight - height) / 2) });
        return;
      }

      const top = Math.max(inset, rect.top - pad);
      const left = Math.max(inset, rect.left - pad);
      const right = Math.min(viewportWidth - inset, rect.right + pad);
      const bottom = Math.min(viewportHeight - inset, rect.bottom + pad, top + 215);
      const gap = 12;
      const below = bottom + gap;
      const above = top - gap - height;
      setAnchor({ top, left, width: right - left, height: bottom - top });
      const rightOfAnchor = right + gap;
      const leftOfAnchor = left - width - gap;
      const fitsOnRight = rightOfAnchor + width <= viewportWidth - inset;
      const fitsOnLeft = leftOfAnchor >= inset;
      setCardStyle({
        width,
        left: fitsOnRight ? rightOfAnchor : fitsOnLeft ? leftOfAnchor : Math.min(left, viewportWidth - width - inset),
        top: fitsOnLeft || fitsOnRight ? Math.min(top, viewportHeight - height - inset) :
          below + height <= viewportHeight - inset ? below : Math.max(inset, above),
      });
    }

    place();
    const frame = requestAnimationFrame(place);
    const observer = new ResizeObserver(place);
    if (element) observer.observe(element);
    if (card.current) observer.observe(card.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [stop]);

  return (
    <Dialog titleId="tour-title" className="tour-dialog" close={close}>
      {anchor ? <div className="tour-highlight" style={anchor} aria-hidden="true" /> : <div className="tour-shade" aria-hidden="true" />}
      <div ref={card} className="tour-card" style={cardStyle}>
        <span className="tour-count mono">{index + 1} of {tourStops.length}</span>
        <h2 id="tour-title">{stop.title}</h2>
        <p>{stop.description}</p>
        <div className="dialog-actions">
          <button type="button" className="button button-secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>Back</button>
          <button ref={next} data-focus type="button" className="button button-primary" onClick={last ? close : () => setIndex(index + 1)}>{last ? "Done" : "Next"} <Icon name={last ? "check" : "arrow"} /></button>
        </div>
      </div>
    </Dialog>
  );
}

function diagnosticLabel(field: string | null, guides: FieldGuides) {
  if (!field) return "Datasheet";
  const guide = guides[field.replace(/\[\d+\]/g, "[]")];
  const pin = field.match(/^pins\[(\d+)\]/);
  if (pin && guide) return `Pin ${Number(pin[1]) + 1} · ${guide.label}`;
  if (field === "advanced") return "Everything else (JSON)";
  return guide?.label ?? field;
}

export function Checks({ diagnostics, guides, checking, close, go, retry }: {
  diagnostics: StudioDiagnostic[]; guides: FieldGuides; checking: boolean;
  close: () => void; go: (field: string | null) => void; retry?: () => void;
}) {
  return (
    <Dialog titleId="checks-title" className="checks-dialog" close={close}>
      <div className="checks-heading">
        <h2 id="checks-title">Checks</h2>
        <button type="button" className="icon-button" aria-label="Close checks" onClick={close} data-focus><Icon name="close" /></button>
      </div>
      <div className="checks-content" aria-live="polite">
        {diagnostics.length ? <ul className="check-list">
          {diagnostics.map((item, index) => (
            <li key={`${item.code}-${item.path}-${index}`}>
              <span className={`check-severity ${item.severity}`}>{item.severity === "info" ? "Note" : item.severity === "warning" ? "Warning" : "Error"}</span>
              <h3>{diagnosticLabel(item.field, guides)}</h3>
              {item.field && item.field !== "advanced" && <code className="check-path">{item.field}</code>}
              <p>{item.message}</p>
              {item.severity !== "info" && <button type="button" className="text-button" onClick={() => go(item.field)}
                aria-label={`Go to field: ${diagnosticLabel(item.field, guides)}`}>Go to field <Icon name="arrow" /></button>}
            </li>
          ))}
        </ul> : <p>{checking ? "Checking the latest values…" : "The datasheet passed its checks."}</p>}
        {retry && <button type="button" className="button button-secondary" onClick={retry}>Retry check</button>}
      </div>
    </Dialog>
  );
}
