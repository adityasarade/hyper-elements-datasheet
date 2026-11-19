import type { CSSProperties } from "react";

export function WrenMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="26" height="26" fill="currentColor">
      <path d="M6.1 8.1 1.5 2.1l2.1-1 4.7 5.3zM14.6 5.5 16 6.4l-1.4.8z" />
      <circle cx="8.4" cy="9.47" r="4.93" />
      <circle cx="12.07" cy="6.27" r="2.93" />
      <circle cx="12.73" cy="5.73" r=".63" fill="var(--paper)" />
      <path d="M2.7 15.05h12" stroke="currentColor" strokeWidth=".93" />
    </svg>
  );
}

export function BoardIcon({ pins, twoEdges }: { pins: number; twoEdges: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 42" className="board-icon" fill="none">
      <rect x="8" y="4" width="48" height="34" rx="4" className="board-outline" />
      <path d="M21 13h8l5 5m-13 11h7l5-5m8-5h7m-7 5h3l5 5" stroke="currentColor" opacity=".45" />
      <rect x="33" y="17" width="9" height="9" rx="1" stroke="currentColor" />
      <circle cx="19" cy="10" r="2" stroke="currentColor" opacity=".65" />
      <circle cx="46" cy="32" r="2" stroke="currentColor" opacity=".65" />
      {Array.from({ length: pins }, (_, index) => {
        const perEdge = twoEdges ? Math.ceil(pins / 2) : pins;
        const right = index >= perEdge;
        return <rect key={index} x={right ? 54 : 6} y={9 + (index % perEdge) * (21 / (perEdge - 1))} width="4" height="2.8" rx=".5" fill="currentColor" />;
      })}
    </svg>
  );
}

const paths = {
  arrow: "M3 8h10m-4-4 4 4-4 4",
  back: "M13 8H3m4-4L3 8l4 4",
  check: "m3.5 8 3 3 6-6",
  chevron: "m4 6 4 4 4-4",
  close: "m4 4 8 8m0-8-8 8",
  down: "M8 3v10m-4-4 4 4 4-4",
  download: "M8 2.5v7m-3-3 3 3 3-3M3 10v3.5h10V10",
  file: "M4 2.5h5l3 3v8H4zm5 0v3h3M6 8h4m-4 3h4",
  help: "M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM6.5 6a1.5 1.5 0 1 1 2.4 1.2C8.4 7.6 8 8 8 8.6M8 11h.01",
  plus: "M8 3v10M3 8h10",
  reset: "M3 7a5 5 0 1 1 1.2 4.3M3 3v4h4",
  up: "M8 13V3m-4 4 4-4 4 4",
};

export function Icon({ name, style }: { name: keyof typeof paths; style?: CSSProperties }) {
  return (
    <svg style={style} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={paths[name]} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
