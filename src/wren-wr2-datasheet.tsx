/**
 * Wren Instruments (a fictional maker of sensor breakout boards) publishes the datasheet for its WR-2
 * environmental sensor: four pages of A4 or Letter, rendered again for every revision of the board.
 *
 * Warm paper, ink and one wren's russet, kept for copper and for what was measured: the pads, the
 * pin numbers and the curves. Barlow, a grotesk in the manner of DIN (the lettering of engineering
 * drawings), for the words; Chivo Mono for pin names and values. The one idea is that nothing is
 * drawn by hand: the board, its pin callouts, the schematic and the dimension drawing are all drawn
 * from the pin list and the board's size, so the pin table and the drawings can't drift apart.
 */
import type { ReactElement, ReactNode } from "react";
import { Circle, Column, Document, Grid, Heading, Layer, Line, List, ListItem, PageFooter, PageHeader, PageNumber, Path, Polygon, Rect, Row, Span, Svg, Table, TableCell, TableRow, Text } from "@hyper-elements/react";

export const meta = {
  title: "Wren WR-2 datasheet",
  description: "A sensor board's datasheet: the board, its pins, the schematic and the dimension drawing all drawn from one pin list, and the revision on every page.",
  root: "Document",
};

/* ------------------------------------------------------------------------------------------------ */
/* The data                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

export type PinType = "Power" | "Ground" | "I/O" | "Input" | "Output";
/** A pad, numbered by its place in the list: pin 1 first. */
export type Pin = { name: string; type: PinType; description: string; pullUp?: boolean };
/** The board, in mm. `edges`: all the pads down the left edge, or the first half down the left and the rest up the right. */
export type Board = { width: number; height: number; thickness: number; parts: number; hole: number; edges: "one" | "two" };
/** A line of a table of limits. A symbol's subscript follows an underscore: "V_IN". */
export type Rating = { parameter: string; symbol?: string; min?: string; max?: string; unit: string };
export type Characteristic = { group?: string; parameter: string; symbol?: string; conditions?: string; min?: string; typ?: string; max?: string; unit?: string };
/** A typical-performance chart: the typical error at each x, and the ± limit around it. */
export type Curve = { title: string; x: string; y: string; points: Array<{ x: number; typ: number; limit: number }> };
export type I2cMode = "Standard" | "Fast" | "Fast-mode Plus";
export type Order = { part: string; description: string; pack: string };
export type Revision = { rev: string; date: string; changes: string };

export type Datasheet = {
  part: string;
  name: string;
  revision: string;
  /** The revision's date, YYYY-MM-DD: the datasheet shows its month. */
  date: string;
  summary: string;
  highlights: Array<{ value: string; label: string }>;
  features: string[];
  applications: string[];
  description: string;
  board: Board;
  pins: Pin[];
  ratings: Rating[];
  characteristics: Characteristic[];
  curves: Curve[];
  i2c: { mode: I2cMode; notes: string[] };
  application: string[];
  ordering: Order[];
  revisions: Revision[];
};

export type WrenDatasheetProps = Partial<Datasheet> & { size?: "A4" | "Letter" };

export const WR2: Datasheet = {
  part: "WR-2",
  name: "Environmental sensor",
  revision: "C",
  date: "2026-03-16",
  summary: "Temperature, humidity, pressure and air quality on a 25 × 18 mm board, read over I²C.",
  highlights: [
    { value: "±0.2 °C", label: "Temperature, 0 to 65 °C" },
    { value: "±2 %RH", label: "Humidity, 20 to 80 %RH" },
    { value: "±0.6 hPa", label: "Pressure, 300 to 1100 hPa" },
    { value: "3.4 µA", label: "Asleep, between readings" },
  ],
  features: [
    "Temperature, humidity, pressure and VOC on one board",
    "Calibrated in the factory: ±0.2 °C and ±2 %RH",
    "Runs from 3.0 to 5.5 V; logic stays at 3.3 V",
    "I²C up to 400 kHz, at either of two addresses",
    "3.4 µA asleep, 0.9 mA while measuring",
    "Castellated pads on a 2.54 mm pitch: solder it flat or fit a header",
  ],
  applications: ["Indoor air quality monitors", "Ventilation and HVAC control", "Weather stations", "Greenhouse and cold-store loggers", "Battery-powered sensor nodes"],
  description:
    "WR-2 measures temperature, relative humidity, barometric pressure and volatile organic compounds, and reports all four over I²C. A low-dropout regulator lets it run from 3.0 to 5.5 V while its logic stays at 3.3 V, and it sleeps at 3.4 µA between readings.",
  board: { width: 25, height: 18, thickness: 1.6, parts: 0.9, hole: 2.2, edges: "one" },
  pins: [
    { name: "VIN", type: "Power", description: "Supply, 3.0 to 5.5 V. The on-board regulator makes 3.3 V." },
    { name: "GND", type: "Ground", description: "Ground." },
    { name: "SCL", type: "Input", description: "I²C clock. Pull up to 3.3 V on the host.", pullUp: true },
    { name: "SDA", type: "I/O", description: "I²C data, open drain. Pull up to 3.3 V on the host.", pullUp: true },
    { name: "INT", type: "Output", description: "Data ready, active low, open drain.", pullUp: true },
    { name: "ADDR", type: "Input", description: "I²C address: low for 0x76, high for 0x77. Pulled low on the board." },
  ],
  ratings: [
    { parameter: "Supply voltage", symbol: "V_IN", min: "−0.3", max: "6.0", unit: "V" },
    { parameter: "Voltage on SCL, SDA, INT and ADDR", symbol: "V_IO", min: "−0.3", max: "3.6", unit: "V" },
    { parameter: "Operating temperature", symbol: "T_A", min: "−40", max: "85", unit: "°C" },
    { parameter: "Storage temperature", symbol: "T_STG", min: "−45", max: "125", unit: "°C" },
    { parameter: "Soldering temperature, 10 s", symbol: "T_SOL", max: "260", unit: "°C" },
    { parameter: "Electrostatic discharge, human body model", symbol: "V_ESD", max: "±2", unit: "kV" },
  ],
  characteristics: [
    { group: "Temperature", parameter: "Accuracy", symbol: "ΔT", conditions: "0 to 65 °C", typ: "±0.2", max: "±0.4", unit: "°C" },
    { group: "Temperature", parameter: "Accuracy", symbol: "ΔT", conditions: "−40 to 85 °C", typ: "±0.5", max: "±1.0", unit: "°C" },
    { group: "Temperature", parameter: "Resolution", typ: "0.01", unit: "°C" },
    { group: "Humidity", parameter: "Accuracy", symbol: "ΔRH", conditions: "20 to 80 %RH", typ: "±2", max: "±3", unit: "%RH" },
    { group: "Humidity", parameter: "Response time, to 63 %", symbol: "t_63", conditions: "Air at 1 m/s", typ: "8", unit: "s" },
    { group: "Pressure", parameter: "Range", symbol: "P", min: "300", max: "1100", unit: "hPa" },
    { group: "Pressure", parameter: "Accuracy", symbol: "ΔP", conditions: "0 to 65 °C", typ: "±0.6", max: "±1.0", unit: "hPa" },
    { group: "Air quality", parameter: "VOC index", min: "1", max: "500", unit: "–" },
    { group: "Supply", parameter: "Supply voltage", symbol: "V_IN", min: "3.0", typ: "3.3", max: "5.5", unit: "V" },
    { group: "Supply", parameter: "Current, asleep", symbol: "I_SLP", typ: "3.4", max: "6.0", unit: "µA" },
    { group: "Supply", parameter: "Current, measuring", symbol: "I_DD", conditions: "T, RH and P at 1 Hz", typ: "0.9", max: "1.2", unit: "mA" },
    { group: "Supply", parameter: "Current, gas heater on", symbol: "I_HT", conditions: "320 °C for 150 ms", typ: "12", max: "15", unit: "mA" },
    { group: "Interface", parameter: "I²C clock", symbol: "f_SCL", max: "400", unit: "kHz" },
    { group: "Interface", parameter: "Start-up time", symbol: "t_ST", conditions: "Power on to first reading", typ: "2", max: "5", unit: "ms" },
  ],
  curves: [
    {
      title: "Temperature error",
      x: "Temperature, °C",
      y: "Error, °C",
      points: [
        { x: -40, typ: 0.24, limit: 0.5 },
        { x: -20, typ: 0.13, limit: 0.4 },
        { x: 0, typ: 0.05, limit: 0.25 },
        { x: 10, typ: 0.02, limit: 0.2 },
        { x: 25, typ: 0, limit: 0.2 },
        { x: 40, typ: -0.03, limit: 0.2 },
        { x: 55, typ: -0.04, limit: 0.2 },
        { x: 65, typ: -0.02, limit: 0.25 },
        { x: 85, typ: 0.12, limit: 0.45 },
      ],
    },
    {
      title: "Humidity error at 25 °C",
      x: "Relative humidity, %RH",
      y: "Error, %RH",
      points: [
        { x: 0, typ: 1.2, limit: 3.5 },
        { x: 10, typ: 0.8, limit: 3 },
        { x: 20, typ: 0.4, limit: 2 },
        { x: 40, typ: 0.1, limit: 2 },
        { x: 60, typ: -0.3, limit: 2 },
        { x: 80, typ: -0.6, limit: 2 },
        { x: 90, typ: -1, limit: 2.6 },
        { x: 100, typ: -1.6, limit: 3.5 },
      ],
    },
  ],
  i2c: {
    mode: "Fast",
    notes: [
      "WR-2 is an I²C target. It answers at 0x76 with ADDR low, as shipped, and at 0x77 with ADDR high, so two boards can share a bus.",
      "SCL, SDA and INT are open drain. Pull each up to 3.3 V on the host: 4.7 kΩ suits a bus of up to 200 pF at 400 kHz.",
    ],
  },
  application: [
    "Put C1 within 5 mm of VIN, between VIN and GND.",
    "Keep the board away from regulators, LEDs and anything else that warms the air it measures.",
  ],
  ordering: [
    { part: "WR-2-C", description: "WR-2, revision C, castellated pads", pack: "Tray of 50" },
    { part: "WR-2-C-H", description: "WR-2 with a 6-way 2.54 mm header fitted", pack: "Bag of 10" },
    { part: "WR-2-C-T", description: "WR-2 on tape and reel, for pick and place", pack: "Reel of 500" },
  ],
  revisions: [
    { rev: "C", date: "2026-03-16", changes: "New regulator: asleep, 3.4 µA (was 9 µA). Mounting holes now 2.2 mm." },
    { rev: "B", date: "2025-09-08", changes: "ADDR pin added, so two boards can share a bus." },
    { rev: "A", date: "2025-02-24", changes: "First release." },
  ],
};

/* ------------------------------------------------------------------------------------------------ */
/* The look                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

const PAPER = "#F8F6F1";
const INK = "#1D201E";
const QUIET = "#6A6D67";
const RULE = "#D9D5CB";
const RULE_DARK = "#B4AFA3";
const BOARD = "#E9E5DB";
const GRID_MINOR = "#ECE8E0";
const GRID_MAJOR = "#DCD7CC";
const PART = "#2E312F";
const METAL = "#A7A49A";
const RUSSET = "#A9471F";

const SANS = "Barlow, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'Chivo Mono', Menlo, Consolas, monospace";

const FONTS: Array<{ family: string; src: string; format: "woff2"; weight: number | `${number} ${number}` }> = [
  { family: "Barlow", src: "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3p-ks51ostz0rdg.woff2", format: "woff2", weight: 300 },
  { family: "Barlow", src: "https://fonts.gstatic.com/s/barlow/v13/7cHpv4kjgoGqM7E_DMs5ynghnQ.woff2", format: "woff2", weight: 400 },
  { family: "Barlow", src: "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3_-gs51ostz0rdg.woff2", format: "woff2", weight: 500 },
  { family: "Barlow", src: "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E30-8s51ostz0rdg.woff2", format: "woff2", weight: 600 },
  { family: "Chivo Mono", src: "https://fonts.gstatic.com/s/chivomono/v11/mFT0WbgRxKvF_Z5eQMO9gx8D1WB4m9w.woff2", format: "woff2", weight: "400 700" },
];

/** Page sizes at 96 px to the inch, and the side margin: the width everything lays out in. */
const PAPER_SIZE = { A4: { width: 794 }, Letter: { width: 816 } } as const;
const SIDE = 52;
const GAP = 28;
/** Millimetres to px at 96 to the inch: the drawings are to scale when the PDF prints at 100 %. */
const MM = 96 / 25.4;

const hairline = (color = RULE) => `1px solid ${color}`;

/** Small mono capitals: labels, table heads, captions. */
const label = { fontFamily: MONO, fontSize: 8, fontWeight: 500, lineHeight: 1.35, letterSpacing: 0.9, textTransform: "uppercase", color: QUIET } as const;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "2026-03" as "March 2026". */
const month = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
};

const UNITS = "mV|mA|µA|nA|V|mW|µW|W|°C|°/s|%RH|%|hPa|kPa|Pa|kHz|MHz|Hz|ms|µs|ns|s|mm|kΩ|MΩ|Ω|nF|µF|pF|kV|ppm|bar|mg|µg|g";
/** Keeps a number with its unit, and both sides of a ×, on one line: "3.4 µA", "25 × 18 mm". */
const nb = (text: string) => text.replace(new RegExp(`(\\d) (?=(?:${UNITS})(?![\\w]))`, "gu"), "$1\u00A0").replace(/ × /g, "\u00A0×\u00A0");

/** A symbol written "V_IN": V, with IN as a subscript. */
const sym = (s: string | undefined, size = 11) => {
  if (!s) return "";
  const [base, sub] = s.split(/_(.+)/);
  return sub ? (
    <>
      {base}
      <Span style={{ fontSize: Math.round(size * 0.72 * 10) / 10, verticalAlign: "sub" }}>{sub}</Span>
    </>
  ) : (
    base
  );
};

/* ------------------------------------------------------------------------------------------------ */
/* Drawing: a pen for Svg shapes, and labels laid over them                                         */
/* ------------------------------------------------------------------------------------------------ */

type Paint = { fill?: string; stroke?: string; strokeWidth?: number; opacity?: number };
type Pt = [number, number];
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Collects an Svg's shapes, each keyed, its coordinates rounded to a hundredth of a px. */
class Pen {
  shapes: ReactElement[] = [];
  line(x1: number, y1: number, x2: number, y2: number, stroke = INK, strokeWidth = 1, opacity?: number) {
    const k = this.shapes.length;
    this.shapes.push(<Line key={k} x1={r2(x1)} y1={r2(y1)} x2={r2(x2)} y2={r2(y2)} style={{ stroke, strokeWidth, ...(opacity === undefined ? {} : { opacity }) }} />);
  }
  rect(x: number, y: number, width: number, height: number, paint: Paint, rx?: number) {
    const k = this.shapes.length;
    this.shapes.push(<Rect key={k} x={r2(x)} y={r2(y)} width={r2(width)} height={r2(height)} {...(rx ? { rx: r2(rx) } : {})} style={paint} />);
  }
  circle(cx: number, cy: number, r: number, paint: Paint) {
    const k = this.shapes.length;
    this.shapes.push(<Circle key={k} cx={r2(cx)} cy={r2(cy)} r={r2(r)} style={paint} />);
  }
  poly(points: Pt[], paint: Paint) {
    const k = this.shapes.length;
    this.shapes.push(<Polygon key={k} points={points.map(([x, y]) => `${r2(x)},${r2(y)}`).join(" ")} style={paint} />);
  }
  /** An open polyline, stroked. */
  polyline(points: Pt[], stroke = INK, strokeWidth = 1, opacity?: number) {
    this.path(points.map(([x, y], i) => `${i ? "L" : "M"}${r2(x)} ${r2(y)}`).join(" "), { stroke, strokeWidth, ...(opacity === undefined ? {} : { opacity }) });
  }
  path(d: string, paint: Paint) {
    const k = this.shapes.length;
    this.shapes.push(<Path key={k} d={d} style={{ fill: "transparent", ...paint }} />);
  }
  /** A dashed line, as short strokes along it. */
  dash(x1: number, y1: number, x2: number, y2: number, stroke = INK, strokeWidth = 0.75, on = 3, off = 2.5) {
    const length = Math.hypot(x2 - x1, y2 - y1);
    const [ux, uy] = [(x2 - x1) / length, (y2 - y1) / length];
    let d = "";
    for (let t = 0; t < length; t += on + off) {
      const e = Math.min(length, t + on);
      d += `M${r2(x1 + ux * t)} ${r2(y1 + uy * t)}L${r2(x1 + ux * e)} ${r2(y1 + uy * e)}`;
    }
    this.path(d, { stroke, strokeWidth });
  }
  /** An arrowhead whose tip is at x, y, pointing along dx, dy. */
  arrow(x: number, y: number, dx: number, dy: number, color = INK, length = 5, half = 1.6) {
    const n = Math.hypot(dx, dy);
    const [ux, uy] = [dx / n, dy / n];
    this.poly(
      [
        [x, y],
        [x - ux * length - uy * half, y - uy * length + ux * half],
        [x - ux * length + uy * half, y - uy * length - ux * half],
      ],
      { fill: color },
    );
  }
}

/** A label laid over a drawing: centred on y, and on x by its alignment. */
type Tag = { x: number; y: number; text: ReactNode; align?: "left" | "right" | "center"; w?: number; size?: number; font?: string; color?: string; weight?: 400 | 500 | 600; caps?: boolean; tracking?: number };

const tag = (t: Tag, key: number, width: number) => {
  const size = t.size ?? 8;
  const height = Math.round(size * 12) / 10;
  const w = Math.min(width, t.w ?? 80);
  const align = t.align ?? "left";
  const left = Math.max(0, Math.min(width - w, align === "right" ? t.x - w : align === "center" ? t.x - w / 2 : t.x));
  return (
    <Column key={key} style={{ padding: [Math.max(0, r2(t.y - height / 2)), 0, 0, r2(left)] }}>
      <Text
        style={{
          width: w,
          textAlign: align,
          fontFamily: t.font ?? MONO,
          fontSize: size,
          lineHeight: `${height}px`,
          fontWeight: t.weight ?? 400,
          color: t.color ?? INK,
          letterSpacing: t.tracking ?? 0,
          textTransform: t.caps ? "uppercase" : "none",
        }}
      >
        {t.text}
      </Text>
    </Column>
  );
};

/** An Svg with labels over it: the shapes from a Pen, the words as text. */
const Drawing = ({ width, height, title, pen, tags }: { width: number; height: number; title: string; pen: Pen; tags: Tag[] }) => (
  <Layer style={{ width }}>
    <Svg width={width} height={height} title={title}>
      {pen.shapes}
    </Svg>
    {tags.map((t, i) => tag(t, i, width))}
  </Layer>
);

/** A dimension along x: a line between x1 and x2 at y, arrows at its ends, its value above it. */
function dimX(pen: Pen, tags: Tag[], x1: number, x2: number, y: number, value: string) {
  const span = x2 - x1;
  if (span >= 14) {
    pen.line(x1, y, x2, y, INK, 0.6);
    pen.arrow(x1, y, -1, 0);
    pen.arrow(x2, y, 1, 0);
  } else {
    pen.line(x1 - 9, y, x2 + 9, y, INK, 0.6);
    pen.arrow(x1, y, 1, 0);
    pen.arrow(x2, y, -1, 0);
  }
  tags.push({ x: (x1 + x2) / 2, y: y - 6.5, text: value, align: "center", w: 48, size: 8 });
}

/** A dimension along y, its value written level: in a gap in the line, or beside it where the span is short. */
function dimY(pen: Pen, tags: Tag[], y1: number, y2: number, x: number, value: string, beside?: "left" | "right") {
  const span = y2 - y1;
  const text = 11;
  if (!beside && span >= 34) {
    const mid = (y1 + y2) / 2;
    pen.line(x, y1, x, mid - text / 2 - 2, INK, 0.6);
    pen.line(x, mid + text / 2 + 2, x, y2, INK, 0.6);
    tags.push({ x, y: mid, text: value, align: "center", w: 40, size: 8 });
  } else {
    if (span >= 14) pen.line(x, y1, x, y2, INK, 0.6);
    else pen.line(x, y1 - 9, x, y2 + 9, INK, 0.6);
    const side = beside ?? "left";
    tags.push({ x: side === "left" ? x - 4 : x + 4, y: (y1 + y2) / 2, text: value, align: side === "left" ? "right" : "left", w: value.length * 5 + 4, size: 8 });
  }
  if (span >= 14) {
    pen.arrow(x, y1, 0, -1);
    pen.arrow(x, y2, 0, 1);
  } else {
    pen.arrow(x, y1, 0, 1);
    pen.arrow(x, y2, 0, -1);
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* The board: where its pads, holes and parts are, in mm                                            */
/* ------------------------------------------------------------------------------------------------ */

const PITCH = 2.54;
/** A castellated pad: its length along the edge and its depth into the board, and the half-hole at the edge. */
const PAD_LONG = 1.7;
const PAD_DEEP = 1.5;
const HALF_HOLE = 0.5;

type PadAt = { n: number; side: "left" | "right"; y: number };

/** The pads: down the left edge from pin 1, and on a board with pads on two edges, back up the right. */
function padsOf(board: Board, count: number): PadAt[] {
  const left = board.edges === "two" ? Math.ceil(count / 2) : count;
  const right = count - left;
  const at = (k: number, i: number) => board.height / 2 + (i - (k - 1) / 2) * PITCH;
  return Array.from({ length: count }, (_, i) =>
    i < left ? { n: i + 1, side: "left" as const, y: at(left, i) } : { n: i + 1, side: "right" as const, y: at(right, count - 1 - i) },
  );
}

/** The mounting holes' centres: at the corners clear of the pads, or top and bottom centre. */
function holesOf(board: Board, pads: PadAt[]): Pt[] {
  if (!board.hole) return [];
  const c = Math.max(2.5, board.hole / 2 + 1.4);
  const { width: W, height: H } = board;
  if (board.edges !== "two") return [[W - c, c], [W - c, H - c]];
  const top = Math.min(...pads.map((p) => p.y)) - PAD_LONG / 2;
  if (top - (c + board.hole / 2) >= 0.6) return [[c, c], [W - c, c], [c, H - c], [W - c, H - c]];
  return [[W / 2, c], [W / 2, H - c]];
}

type Box = [number, number, number, number];
const clear = (a: Box, b: Box, gap = 0.3) => a[2] + gap <= b[0] || b[2] + gap <= a[0] || a[3] + gap <= b[1] || b[3] + gap <= a[1];
const around = ([x, y]: Pt, w: number, h: number): Box => [x - w / 2, y - h / 2, x + w / 2, y + h / 2];

/**
 * The parts on the board: the sensor, its regulator and their capacitors, and the Wren mark. Each goes where the
 * family's layout puts it, and only if it fits there: inside the board, clear of the pads, their traces, the holes
 * and the parts before it. A small board shows fewer parts rather than parts on top of each other.
 */
function partsOf(board: Board, pads: PadAt[], holes: Pt[]) {
  const { width: W, height: H } = board;
  const two = board.edges === "two";
  const taken: Box[] = [];
  if (pads.some((p) => p.side === "left")) taken.push([0, 0, PAD_DEEP + 1.7, H]);
  if (pads.some((p) => p.side === "right")) taken.push([W - PAD_DEEP - 1.7, 0, W, H]);
  for (const h of holes) taken.push(around(h, board.hole + 2.3, board.hole + 2.3));
  const place = (at: Pt, w: number, h: number): Pt | undefined => {
    const box = around(at, w, h);
    if (box[0] < 0.5 || box[1] < 0.5 || box[2] > W - 0.5 || box[3] > H - 0.5 || !taken.every((t) => clear(box, t))) return undefined;
    taken.push(box);
    return at;
  };
  const x0 = PAD_DEEP + 1.2;
  const x1 = two ? W - x0 : holes.length ? Math.min(...holes.map((h) => h[0])) - board.hole / 2 - 0.8 : W - 1.2;
  const sensor = place(two ? [W / 2, H / 2] : [x0 + (x1 - x0) * 0.52, H / 2], 4.2, 4.2);
  // The traces run from the pads to the sensor's sides: keep the other parts out of their way.
  const top = Math.min(...pads.map((p) => p.y)) - PAD_LONG / 2;
  const bottom = Math.max(...pads.map((p) => p.y)) + PAD_LONG / 2;
  if (sensor) {
    taken.push([0, top, sensor[0] - 1.3, bottom]);
    if (two) taken.push([sensor[0] + 1.3, top, W, bottom]);
  }
  const ry = two ? Math.max(2, Math.min(H * 0.2, top - 1.8)) : Math.max(2.6, H * 0.26);
  const regulator = place(two ? [W / 2, ry] : [Math.min(x1 - 1.6, (sensor?.[0] ?? W / 2) + 4.6), ry], 2.9, 2.8);
  const caps: Pt[] = [];
  if (regulator) {
    const spots: Pt[] = two ? [[W / 2 - 2.7, ry], [W / 2 + 2.7, ry]] : [[regulator[0] - 0.95, ry + 2.9], [regulator[0] + 0.95, ry + 2.9]];
    for (const spot of spots) {
      const at = place(spot, two ? 1.6 : 0.8, two ? 0.8 : 1.6);
      if (at) caps.push(at);
    }
  }
  const decouple = sensor ? place(two ? [W / 2, H / 2 + 3] : [sensor[0], sensor[1] - 3], 1.6, 0.8) : undefined;
  const markAt = place(two ? [W / 2, Math.max(bottom + 1.8, H / 2 + 5.8)] : [regulator?.[0] ?? x1 - 2, Math.min(H - 2.4, H * 0.74)], 2.8, 2.8);
  return { sensor, regulator, caps, capsVertical: !two, decouple, markAt };
}

const TRACE = "#D9D2C2";

/** The board seen from above, drawn into a Pen at `s` px to the mm with its top left corner at ox, oy. */
function drawBoard(pen: Pen, board: Board, pins: Pin[], ox: number, oy: number, s: number, detail: boolean) {
  const { width: W, height: H } = board;
  const X = (mm: number) => ox + mm * s;
  const Y = (mm: number) => oy + mm * s;
  const pads = padsOf(board, pins.length);
  const holes = holesOf(board, pads);
  pen.rect(X(0), Y(0), W * s, H * s, { fill: BOARD, stroke: INK, strokeWidth: 1.1 }, 0.8 * s);
  const parts = partsOf(board, pads, holes);

  if (detail && parts.sensor) {
    const [sx, sy] = parts.sensor;
    // Traces: each signal pad's runs in, turns at 45 degrees and lands under the sensor; power and ground drop to a via.
    for (const side of ["left", "right"] as const) {
      const here = pads.filter((p) => p.side === side);
      const signals = here.filter((p) => !["Power", "Ground"].includes(pins[p.n - 1].type));
      const dir = side === "left" ? 1 : -1;
      const edge = side === "left" ? 0 : W;
      const pitch = Math.min(0.75, 2.4 / Math.max(1, signals.length - 1));
      const land = sx - dir * 1.3;
      signals.forEach((p, k) => {
        const ty = sy + (k - (signals.length - 1) / 2) * pitch;
        const run = Math.abs(ty - p.y);
        const knee = land - dir * (0.7 + run);
        const bend = dir > 0 ? Math.max(PAD_DEEP + 0.5, knee) : Math.min(W - PAD_DEEP - 0.5, knee);
        pen.polyline([[X(edge + dir * (PAD_DEEP - 0.3)), Y(p.y)], [X(bend), Y(p.y)], [X(land - dir * 0.7), Y(ty)], [X(land), Y(ty)]], TRACE, 0.34 * s);
      });
      for (const p of here.filter((q) => !signals.includes(q))) {
        const vx = edge + dir * (PAD_DEEP + 1.15);
        pen.line(X(edge + dir * (PAD_DEEP - 0.3)), Y(p.y), X(vx), Y(p.y), TRACE, 0.34 * s);
        pen.circle(X(vx), Y(p.y), 0.42 * s, { fill: METAL });
        pen.circle(X(vx), Y(p.y), 0.17 * s, { fill: PART });
      }
    }
  }

  for (const p of pads) {
    const x = p.side === "left" ? X(0) : X(W - PAD_DEEP);
    pen.rect(x, Y(p.y - PAD_LONG / 2), PAD_DEEP * s, PAD_LONG * s, { fill: RUSSET }, p.n === 1 ? 0 : 0.25 * s);
    pen.circle(p.side === "left" ? X(0) : X(W), Y(p.y), HALF_HOLE * s, { fill: PAPER, stroke: INK, strokeWidth: 0.6 });
  }
  for (const [hx, hy] of holes) {
    pen.circle(X(hx), Y(hy), (board.hole / 2 + 0.55) * s, { fill: METAL, opacity: 0.55 });
    pen.circle(X(hx), Y(hy), (board.hole / 2) * s, { fill: PAPER, stroke: INK, strokeWidth: 0.8 });
  }
  if (!detail) return { pads, holes };

  // Pin 1: a triangle on the silkscreen, over its pad and pointing at it.
  const first = pads[0];
  const fx = first.side === "left" ? PAD_DEEP / 2 : W - PAD_DEEP / 2;
  const tip = Math.max(0.95, first.y - PAD_LONG / 2 - 0.3);
  pen.poly([[X(fx), Y(tip)], [X(fx - 0.45), Y(tip - 0.7)], [X(fx + 0.45), Y(tip - 0.7)]], { fill: INK });

  // The sensor: a 3 mm LGA package with its vent and its pin 1 dot, inside its courtyard.
  if (parts.sensor) {
    const [sx, sy] = parts.sensor;
    pen.rect(X(sx - 2.1), Y(sy - 2.1), 4.2 * s, 4.2 * s, { fill: "transparent", stroke: INK, strokeWidth: 0.6 }, 0.2 * s);
    pen.rect(X(sx - 1.5), Y(sy - 1.5), 3 * s, 3 * s, { fill: PART }, 0.2 * s);
    pen.circle(X(sx + 0.65), Y(sy - 0.65), 0.38 * s, { fill: PAPER });
    pen.circle(X(sx - 1.1), Y(sy + 1.1), 0.14 * s, { fill: PAPER });
    pen.circle(X(sx - 1.85), Y(sy - 1.85), 0.12 * s, { fill: INK });
  }
  // The regulator: SOT-23-5, three leads below and two above.
  if (parts.regulator) {
    const [rx, ry] = parts.regulator;
    for (const dx of [-0.95, 0, 0.95]) pen.rect(X(rx + dx - 0.2), Y(ry + 0.8), 0.4 * s, 0.6 * s, { fill: METAL });
    for (const dx of [-0.95, 0.95]) pen.rect(X(rx + dx - 0.2), Y(ry - 1.4), 0.4 * s, 0.6 * s, { fill: METAL });
    pen.rect(X(rx - 1.45), Y(ry - 0.8), 2.9 * s, 1.6 * s, { fill: PART }, 0.1 * s);
  }
  // Passives: 0603 capacitors by the regulator, one by the sensor.
  const passive = (cx: number, cy: number, vertical: boolean) => {
    const [w, h] = vertical ? [0.8, 1.6] : [1.6, 0.8];
    pen.rect(X(cx - w / 2), Y(cy - h / 2), w * s, h * s, { fill: "#D3CAB8" }, 0.08 * s);
    const cap = 0.3;
    if (vertical) {
      pen.rect(X(cx - w / 2), Y(cy - h / 2), w * s, cap * s, { fill: METAL });
      pen.rect(X(cx - w / 2), Y(cy + h / 2 - cap), w * s, cap * s, { fill: METAL });
    } else {
      pen.rect(X(cx - w / 2), Y(cy - h / 2), cap * s, h * s, { fill: METAL });
      pen.rect(X(cx + w / 2 - cap), Y(cy - h / 2), cap * s, h * s, { fill: METAL });
    }
  };
  for (const [cx, cy] of parts.caps) passive(cx, cy, parts.capsVertical);
  if (parts.decouple) passive(parts.decouple[0], parts.decouple[1], false);
  // The Wren mark on the silkscreen.
  if (parts.markAt) mark(pen, X(parts.markAt[0] - 1.4), Y(parts.markAt[1] - 1.4), 2.8 * s, "#7C7E78");
  return { pads, holes };
}

/** The Wren mark, a wren with its tail cocked, drawn in a box `size` wide at x, y. */
function mark(pen: Pen, x: number, y: number, size: number, color = RUSSET, opacity?: number) {
  const k = size / 24;
  const P = (px: number, py: number): Pt => [x + px * k, y + py * k];
  const o = opacity === undefined ? {} : { opacity };
  pen.poly([P(9.2, 12.2), P(2.2, 3.2), P(5.4, 1.6), P(12.4, 9.6)], { fill: color, ...o });
  pen.circle(x + 12.6 * k, y + 14.2 * k, 7.4 * k, { fill: color, ...o });
  pen.circle(x + 18.1 * k, y + 9.4 * k, 4.4 * k, { fill: color, ...o });
  pen.poly([P(21.9, 8.2), P(24, 9.6), P(21.9, 10.8)], { fill: color, ...o });
  pen.circle(x + 19.1 * k, y + 8.6 * k, 0.95 * k, { fill: PAPER });
  pen.line(x + 4 * k, y + 22.6 * k, x + 22 * k, y + 22.6 * k, color, Math.max(0.8, 1.4 * k), opacity);
}

const MarkSvg = ({ size }: { size: number }) => {
  const pen = new Pen();
  mark(pen, 0, 0, size);
  return (
    <Svg width={size} height={size} title="Wren Instruments">
      {pen.shapes}
    </Svg>
  );
};

/** The drawing scales a datasheet uses, largest first: n to 1. */
const SCALES = [5, 4, 3, 2.5, 2, 1.5, 1, 0.75, 0.5];
const ratio = (scale: number) => (scale >= 1 ? `${scale} : 1` : `1 : ${1 / scale}`);

/* ------------------------------------------------------------------------------------------------ */
/* Figure 1: the board from above, every pad called out from the pin list                           */
/* ------------------------------------------------------------------------------------------------ */

function BoardFigure({ d, width }: { d: Datasheet; width: number }) {
  const { board, pins } = d;
  const pen = new Pen();
  const tags: Tag[] = [];
  const two = board.edges === "two";
  const longest = Math.max(...pins.map((p) => p.name.length));
  const nameW = Math.max(30, longest * 6.3 + 4);
  /** Name, balloon and leader: the room a side's callouts take. */
  const callout = nameW + 6 + 16 + 18;
  const room = width - callout * (two ? 2 : 1) - (two ? 0 : 14);
  const perSide = two ? Math.ceil(pins.length / 2) : pins.length;
  const tall = 270;
  const margin = 2.5;
  const fits = (k: number) => (board.width + 2 * margin) * k * MM <= room && (board.height + 2 * margin) * k * MM <= tall;
  // The largest scale that fits and keeps the pads a callout apart; else the largest that fits, its callouts fanned out.
  const scale = SCALES.find((k) => fits(k) && PITCH * k * MM >= 17) ?? SCALES.find(fits) ?? SCALES[SCALES.length - 1];
  const s = scale * MM;
  const panelW = (board.width + 2 * margin) * s;
  const panelH = (board.height + 2 * margin) * s;
  const px = callout - margin * s + (two ? 0 : (room - panelW + 6 * s) / 2);
  const ox = px + margin * s;
  const oy = margin * s;
  const height = panelH + 26;

  // The cutting mat: millimetres, every fifth darker, from the board's corner.
  for (let mm = -margin; mm <= board.width + margin + 0.01; mm++) pen.line(ox + mm * s, 0, ox + mm * s, panelH, mm % 5 === 0 ? GRID_MAJOR : GRID_MINOR, mm % 5 === 0 ? 0.75 : 0.5);
  for (let mm = -margin; mm <= board.height + margin + 0.01; mm++) pen.line(px, oy + mm * s, px + panelW, oy + mm * s, mm % 5 === 0 ? GRID_MAJOR : GRID_MINOR, mm % 5 === 0 ? 0.75 : 0.5);

  const { pads } = drawBoard(pen, board, pins, ox, oy, s, true);

  // Callouts: a leader from each pad to a balloon with its number, and its name beyond it. Where the pads are closer
  // than a callout is tall, the callouts spread out evenly around them and the leaders bend to reach them.
  for (const side of ["left", "right"] as const) {
    const here = pads.filter((p) => p.side === side).sort((a, b) => a.y - b.y);
    const at = here.map((p) => oy + p.y * s);
    const spread = [...at];
    for (let i = 1; i < spread.length; i++) spread[i] = Math.max(spread[i], spread[i - 1] + 17);
    const shift = at.reduce((a, b) => a + b, 0) / (at.length || 1) - spread.reduce((a, b) => a + b, 0) / (spread.length || 1);
    const low = Math.max(9, Math.min(...spread) + shift) - (Math.min(...spread) + shift);
    const high = Math.min(0, panelH - 9 - (Math.max(...spread) + shift + low));
    here.forEach((p, i) => {
      const y = at[i];
      const ly = spread[i] + shift + low + high;
      const pin = pins[p.n - 1];
      const left = side === "left";
      const dir = left ? -1 : 1;
      const edge = left ? ox : ox + board.width * s;
      const balloon = left ? callout - 18 - 8 : width - callout + 18 + 8;
      const end = balloon - dir * 8;
      if (Math.abs(ly - y) < 0.5) pen.line(end, y, edge, y, INK, 0.7);
      else pen.polyline([[edge, y], [edge + dir * 10, y], [end - dir * 10, ly], [end, ly]], INK, 0.7);
      pen.circle(balloon, ly, 8, { fill: PAPER, stroke: RUSSET, strokeWidth: 0.9 });
      tags.push({ x: balloon, y: ly, text: String(p.n), align: "center", w: 16, size: 7.5, color: RUSSET, weight: 600 });
      tags.push({ x: left ? balloon - 13 : balloon + 13, y: ly, text: pin.name, align: left ? "right" : "left", w: nameW, size: 9.5, weight: 600 });
    });
  }

  // A 5 mm scale bar under the mat, at its right.
  const bar = 5 * s;
  const bx = px + panelW - bar;
  const by = panelH + 13;
  for (let i = 0; i < 5; i++) pen.rect(bx + i * s, by - 2, s, 4, { fill: i % 2 ? PAPER : INK, stroke: INK, strokeWidth: 0.5 });
  tags.push({ x: bx - 6, y: by, text: `5 mm · ${ratio(scale)}`, align: "right", w: 90, size: 7.5, color: QUIET });

  return {
    scale,
    perSide,
    height,
    el: <Drawing width={width} height={height} title={`${d.part} from above at ${ratio(scale)}: the board, its ${pins.length} pads called out by number and name, and its mounting holes.`} pen={pen} tags={tags} />,
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Charts: the typical error and its limits, drawn from the points                                   */
/* ------------------------------------------------------------------------------------------------ */

const STEPS = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100];
const minus = (n: number, digits: number) => {
  const text = Math.abs(n).toFixed(digits);
  return n < 0 ? `−${text}` : n > 0 ? `+${text}` : "0";
};
const decimals = (step: number) => (Number.isInteger(step) ? 0 : String(step).split(".")[1].length);

/** A smooth line through points ordered in x that never overshoots them: monotone cubic (Fritsch and Carlson), as Béziers. */
const smooth = (points: Pt[]) => {
  const n = points.length;
  const dx = points.slice(1).map((p, i) => p[0] - points[i][0]);
  const slope = points.slice(1).map((p, i) => (p[1] - points[i][1]) / dx[i]);
  const m = points.map((_, i) => (i === 0 ? slope[0] : i === n - 1 ? slope[n - 2] : slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const [a, b] = [m[i] / slope[i], m[i + 1] / slope[i]];
    const h = Math.hypot(a, b);
    if (h > 3) {
      m[i] = (3 / h) * a * slope[i];
      m[i + 1] = (3 / h) * b * slope[i];
    }
  }
  let d = `M${r2(points[0][0])} ${r2(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [p, q] = [points[i], points[i + 1]];
    d += ` C${r2(p[0] + dx[i] / 3)} ${r2(p[1] + (m[i] * dx[i]) / 3)} ${r2(q[0] - dx[i] / 3)} ${r2(q[1] - (m[i + 1] * dx[i]) / 3)} ${r2(q[0])} ${r2(q[1])}`;
  }
  return d;
};

function CurveChart({ curve, width, height }: { curve: Curve; width: number; height: number }) {
  const pen = new Pen();
  const tags: Tag[] = [];
  const pts = [...curve.points].sort((a, b) => a.x - b.x);
  const [x0, x1] = [pts[0].x, pts[pts.length - 1].x];
  const reach = Math.max(...pts.map((p) => Math.max(p.limit, Math.abs(p.typ)))) * 1.12;
  const yStep = STEPS.find((k) => Math.ceil(reach / k) <= 3) ?? 100;
  const yMax = Math.ceil(reach / yStep) * yStep;
  const xStep = STEPS.find((k) => (x1 - x0) / k <= 7) ?? 100;
  const L = 36;
  const R = width - 6;
  const T = 22;
  const B = height - 30;
  const X = (v: number) => L + ((v - x0) / (x1 - x0)) * (R - L);
  const Y = (v: number) => T + ((yMax - v) / (2 * yMax)) * (B - T);

  const yTicks = Math.round(yMax / yStep);
  for (let i = -yTicks; i <= yTicks; i++) {
    const v = i * yStep;
    const y = Y(v);
    pen.line(L, y, R, y, i === 0 ? INK : RULE, i === 0 ? 0.75 : 0.6);
    tags.push({ x: L - 6, y, text: minus(v, decimals(yStep)), align: "right", w: 34, size: 7.5, color: QUIET });
  }
  for (let i = Math.ceil(x0 / xStep - 1e-9); i * xStep <= x1 + 1e-9; i++) {
    const v = i * xStep;
    pen.line(X(v), T, X(v), B, RULE, 0.6);
    pen.line(X(v), B, X(v), B + 3, INK, 0.75);
    tags.push({ x: X(v), y: B + 10, text: minus(v, decimals(xStep)).replace("+", ""), align: "center", w: 30, size: 7.5, color: QUIET });
  }
  pen.line(L, B, R, B, INK, 0.75);

  // The limits: a band, its edges dashed.
  const upper = pts.map((p): Pt => [X(p.x), Y(p.limit)]);
  const lower = pts.map((p): Pt => [X(p.x), Y(-p.limit)]);
  pen.poly([...upper, ...lower.reverse()], { fill: RUSSET, opacity: 0.1 });
  for (const edge of [upper, lower]) for (let i = 0; i < edge.length - 1; i++) pen.dash(edge[i][0], edge[i][1], edge[i + 1][0], edge[i + 1][1], RUSSET, 0.75, 2.5, 2);
  // The typical error, through the measured points.
  const typical = pts.map((p): Pt => [X(p.x), Y(p.typ)]);
  pen.path(smooth(typical), { stroke: RUSSET, strokeWidth: 1.6 });
  for (const [x, y] of typical) pen.circle(x, y, 2.1, { fill: PAPER, stroke: RUSSET, strokeWidth: 1 });

  // Axis titles, and the key.
  tags.push({ x: 0, y: 7, text: curve.y, align: "left", w: 140, size: 8.5, font: SANS, color: QUIET });
  tags.push({ x: R, y: B + 23, text: curve.x, align: "right", w: 160, size: 8.5, font: SANS, color: QUIET });
  pen.line(R - 126, 7, R - 112, 7, RUSSET, 1.6);
  pen.circle(R - 119, 7, 2.1, { fill: PAPER, stroke: RUSSET, strokeWidth: 1 });
  tags.push({ x: R - 108, y: 7, text: "Typical", align: "left", w: 44, size: 8.5, font: SANS });
  pen.rect(R - 56, 3, 14, 8, { fill: RUSSET, opacity: 0.1 });
  pen.dash(R - 56, 3, R - 42, 3, RUSSET, 0.75, 2.5, 2);
  pen.dash(R - 56, 11, R - 42, 11, RUSSET, 0.75, 2.5, 2);
  tags.push({ x: R - 38, y: 7, text: "Limits", align: "left", w: 38, size: 8.5, font: SANS });

  return <Drawing width={width} height={height} title={`${curve.title}: the typical error from ${x0} to ${x1}, inside limits of up to ±${Math.max(...pts.map((p) => p.limit))}.`} pen={pen} tags={tags} />;
}

/* ------------------------------------------------------------------------------------------------ */
/* Figure 3: I²C timing, the waveforms drawn from their levels                                       */
/* ------------------------------------------------------------------------------------------------ */

/** The I²C specification's limits (UM10204) for each mode, in the order the table lists them. */
const I2C_TIMING: Record<I2cMode, Array<[string, string, string, string, string]>> = {
  Standard: [
    ["f_SCL", "Clock frequency", "0", "100", "kHz"],
    ["t_HD;STA", "Hold time, START", "4.0", "", "µs"],
    ["t_LOW", "Clock low", "4.7", "", "µs"],
    ["t_HIGH", "Clock high", "4.0", "", "µs"],
    ["t_SU;DAT", "Data set-up time", "250", "", "ns"],
    ["t_HD;DAT", "Data hold time", "0", "3.45", "µs"],
    ["t_SU;STO", "Set-up time, STOP", "4.0", "", "µs"],
    ["t_BUF", "Bus free, STOP to START", "4.7", "", "µs"],
  ],
  Fast: [
    ["f_SCL", "Clock frequency", "0", "400", "kHz"],
    ["t_HD;STA", "Hold time, START", "0.6", "", "µs"],
    ["t_LOW", "Clock low", "1.3", "", "µs"],
    ["t_HIGH", "Clock high", "0.6", "", "µs"],
    ["t_SU;DAT", "Data set-up time", "100", "", "ns"],
    ["t_HD;DAT", "Data hold time", "0", "0.9", "µs"],
    ["t_SU;STO", "Set-up time, STOP", "0.6", "", "µs"],
    ["t_BUF", "Bus free, STOP to START", "1.3", "", "µs"],
  ],
  "Fast-mode Plus": [
    ["f_SCL", "Clock frequency", "0", "1000", "kHz"],
    ["t_HD;STA", "Hold time, START", "0.26", "", "µs"],
    ["t_LOW", "Clock low", "0.5", "", "µs"],
    ["t_HIGH", "Clock high", "0.26", "", "µs"],
    ["t_SU;DAT", "Data set-up time", "50", "", "ns"],
    ["t_HD;DAT", "Data hold time", "0", "", "µs"],
    ["t_SU;STO", "Set-up time, STOP", "0.26", "", "µs"],
    ["t_BUF", "Bus free, STOP to START", "0.5", "", "µs"],
  ],
};

/** A waveform as segments of time: high, low, or data (either), with what the data is. */
type Level = "H" | "L" | "D";
type Segment = [number, number, Level, string?];
const SCL: Segment[] = [[0, 8, "H"], [8, 12, "L"], [12, 16, "H"], [16, 20, "L"], [20, 24, "H"], [24, 28, "L"], [28, 32, "H"], [32, 36, "L"], [36, 49, "H"]];
const SDA: Segment[] = [[0, 4, "H"], [4, 9, "L"], [9, 17, "D", "D7"], [17, 25, "D", "D6"], [25, 33, "D", "ACK"], [33, 40, "L"], [40, 46, "H"], [46, 49, "L"]];
const SPAN = 49;

function TimingDiagram({ width }: { width: number }) {
  const pen = new Pen();
  const tags: Tag[] = [];
  const L = 40;
  const u = (width - L - 8) / SPAN;
  const X = (t: number) => L + t * u;
  const edge = 0.32 * u;
  const amp = 22;
  const sclTop = 40;
  const sdaTop = 104;

  /** One waveform: its rails, and its edges as lines between the rails of the segments either side. */
  const wave = (segments: Segment[], top: number, highlight: number[] = []) => {
    const rails = (l: Level) => (l === "H" ? [top] : l === "L" ? [top + amp] : [top, top + amp]);
    const mid = top + amp / 2;
    segments.forEach(([t0, t1, level, name], i) => {
      const a = i ? X(t0) + edge / 2 : X(t0);
      const b = i < segments.length - 1 ? X(t1) - edge / 2 : X(t1);
      if (level === "D") {
        const prev = segments[i - 1]?.[2];
        const next = segments[i + 1]?.[2];
        const left: Pt[] = prev === "D" ? [[X(t0), mid]] : [[X(t0) - edge / 2, prev === "H" ? top : top + amp]];
        const right: Pt[] = next === "D" ? [[X(t1), mid]] : [[X(t1) + edge / 2, next === "H" ? top : top + amp]];
        pen.poly([...left, [a, top], [b, top], ...right, [b, top + amp], [a, top + amp]], { fill: BOARD });
        if (name) tags.push({ x: (X(t0) + X(t1)) / 2, y: mid, text: name, align: "center", w: 40, size: 7.5, color: QUIET });
      }
      for (const y of rails(level)) pen.line(a, y, b, y, INK, 1.1);
      const next = segments[i + 1];
      if (!next) return;
      const [from, to] = [rails(level), rails(next[2])];
      const pairs: Array<[number, number]> = from.length === 2 && to.length === 2 ? [[from[0], to[1]], [from[1], to[0]]] : from.flatMap((f) => to.map((t): [number, number] => [f, t]));
      for (const [f, t] of pairs) {
        const hot = highlight.includes(t1);
        pen.line(X(t1) - edge / 2, f, X(t1) + edge / 2, t, hot ? RUSSET : INK, hot ? 1.8 : 1.1);
      }
    });
  };

  // Where the times are measured from: faint lines down through both waveforms.
  for (const t of [4, 8, 16, 17, 20, 24, 36, 40, 46]) pen.dash(X(t), 22, X(t), 156, RULE_DARK, 0.6, 2, 2);
  wave(SCL, sclTop);
  wave(SDA, sdaTop, [4, 40, 46]);
  tags.push({ x: 0, y: sclTop + amp / 2, text: "SCL", align: "left", w: 34, size: 9, weight: 600 });
  tags.push({ x: 0, y: sdaTop + amp / 2, text: "SDA", align: "left", w: 34, size: 9, weight: 600 });
  tags.push({ x: X(4), y: 9, text: "START", align: "center", w: 50, size: 7.5, color: RUSSET, weight: 600, tracking: 0.8 });
  tags.push({ x: X(40), y: 9, text: "STOP", align: "center", w: 50, size: 7.5, color: RUSSET, weight: 600, tracking: 0.8 });
  tags.push({ x: X(46), y: 9, text: "START", align: "center", w: 50, size: 7.5, color: RUSSET, weight: 600, tracking: 0.8 });

  /** A time between two edges: a line with arrows, its symbol beside or over it. */
  const time = (a: number, b: number, y: number, symbol: string, where: "over" | "under" | "left" = "over") => {
    const [xa, xb] = [X(a), X(b)];
    if (xb - xa >= 16) {
      pen.line(xa, y, xb, y, INK, 0.6);
      pen.arrow(xa, y, -1, 0, INK, 4.5, 1.5);
      pen.arrow(xb, y, 1, 0, INK, 4.5, 1.5);
    } else {
      pen.line(xa - 10, y, xb + 10, y, INK, 0.6);
      pen.arrow(xa, y, 1, 0, INK, 4.5, 1.5);
      pen.arrow(xb, y, -1, 0, INK, 4.5, 1.5);
    }
    const text = sym(symbol, 8.5);
    if (where === "left") tags.push({ x: xa - 14, y, text, align: "right", w: 60, size: 8.5 });
    else tags.push({ x: (xa + xb) / 2, y: where === "over" ? y - 7.5 : y + 8.5, text, align: "center", w: 60, size: 8.5 });
  };
  time(16, 20, 26, "t_LOW");
  time(20, 24, 26, "t_HIGH");
  time(4, 8, 84, "t_HD;STA");
  time(36, 40, 84, "t_SU;STO");
  time(17, 20, 146, "t_SU;DAT", "under");
  time(16, 17, 146, "t_HD;DAT", "left");
  time(40, 46, 146, "t_BUF", "under");

  return <Drawing width={width} height={166} title="I²C timing: SCL and SDA through a START, three bits and a STOP, with the set-up, hold, high, low and bus-free times marked." pen={pen} tags={tags} />;
}

/* ------------------------------------------------------------------------------------------------ */
/* Figure 4: the typical application, its wiring drawn from the pins' types                          */
/* ------------------------------------------------------------------------------------------------ */

function Schematic({ d, width }: { d: Datasheet; width: number }) {
  const pen = new Pen();
  const tags: Tag[] = [];
  const numbered = d.pins.map((p, i) => ({ ...p, n: i + 1 }));
  const power = numbered.filter((p) => p.type === "Power");
  const ground = numbered.filter((p) => p.type === "Ground");
  const signals = numbered.filter((p) => p.type !== "Power" && p.type !== "Ground");
  const pulled = signals.filter((p) => p.pullUp);
  const row = 24;
  const rail = 20;
  const top = 58;
  const boxH = Math.max(2, signals.length) * row + 20;
  const bottom = top + boxH;
  const ground0 = bottom + 26;
  const height = ground0 + 22;
  const stub = 14;

  const mcu = { x0: 24, x1: 124 };
  const resistors = pulled.map((_, i) => mcu.x1 + stub + 40 + i * 34);
  const partX0 = Math.max(mcu.x1 + stub + 150, (resistors.at(-1) ?? 0) + 52);
  const part = { x0: partX0, x1: partX0 + 112 };
  const capX = part.x1 + 46;
  const right = capX + 54;
  const sy = (i: number) => top + 10 + row * (i + 0.5);

  /** A ground symbol whose top is at x, y. */
  const earth = (x: number, y: number) => {
    pen.line(x - 7, y, x + 7, y, INK, 1.1);
    pen.line(x - 4.5, y + 3.5, x + 4.5, y + 3.5, INK, 1.1);
    pen.line(x - 2, y + 7, x + 2, y + 7, INK, 1.1);
  };
  const dot = (x: number, y: number) => pen.circle(x, y, 2.4, { fill: INK });

  // The supply rail across the top.
  pen.line(mcu.x0 + 3, rail, capX, rail, INK, 1.1);
  pen.circle(mcu.x0, rail, 3, { fill: PAPER, stroke: INK, strokeWidth: 1.1 });
  tags.push({ x: mcu.x0 - 3, y: rail - 11, text: "3V3", align: "left", w: 40, size: 8.5, weight: 600 });

  // The host: VDD to the rail, GND to ground, and a pin for each signal.
  pen.rect(mcu.x0, top, mcu.x1 - mcu.x0, boxH, { fill: PAPER, stroke: INK, strokeWidth: 1.1 });
  const mx = (mcu.x0 + mcu.x1) / 2;
  pen.line(mx, rail, mx, top, INK, 1.1);
  dot(mx, rail);
  pen.line(mx, bottom, mx, ground0, INK, 1.1);
  earth(mx, ground0);
  tags.push({ x: mx, y: top + 9, text: "VDD", align: "center", w: 40, size: 7.5, color: QUIET });
  tags.push({ x: mx, y: bottom - 9, text: "GND", align: "center", w: 40, size: 7.5, color: QUIET });
  tags.push({ x: mcu.x0 + 10, y: (top + bottom) / 2, text: "Host", align: "left", w: 50, size: 11, font: SANS, weight: 600 });
  tags.push({ x: mcu.x0 + 10, y: (top + bottom) / 2 + 13, text: "MCU", align: "left", w: 50, size: 7.5, color: QUIET });

  // The part: power pins on top, ground pins below, signals down its left side, wired across to the host.
  pen.rect(part.x0, top, part.x1 - part.x0, boxH, { fill: PAPER, stroke: INK, strokeWidth: 1.1 });
  tags.push({ x: part.x1 - 10, y: (top + bottom) / 2, text: d.part, align: "right", w: 70, size: 11, font: SANS, weight: 600 });
  const spread = (k: number, i: number) => part.x0 + ((part.x1 - part.x0) * (i + 1)) / (k + 1) + (k === 1 ? 12 : 0);
  power.forEach((p, i) => {
    const x = spread(power.length, i);
    pen.line(x, rail, x, top, INK, 1.1);
    dot(x, rail);
    tags.push({ x, y: top + 9, text: p.name, align: "center", w: 44, size: 7.5, color: QUIET });
    tags.push({ x: x + 4, y: top - 8, text: String(p.n), align: "left", w: 20, size: 7, color: RUSSET });
  });
  ground.forEach((p, i) => {
    const x = spread(ground.length, i);
    pen.line(x, bottom, x, ground0, INK, 1.1);
    earth(x, ground0);
    tags.push({ x, y: bottom - 9, text: p.name, align: "center", w: 44, size: 7.5, color: QUIET });
    tags.push({ x: x + 4, y: bottom + 8, text: String(p.n), align: "left", w: 20, size: 7, color: RUSSET });
  });
  signals.forEach((p, i) => {
    const y = sy(i);
    pen.line(mcu.x1, y, part.x0, y, INK, 1.1);
    tags.push({ x: mcu.x1 - 6, y, text: p.name, align: "right", w: 50, size: 7.5, color: QUIET });
    tags.push({ x: part.x0 + 6, y, text: p.name, align: "left", w: 50, size: 7.5, color: QUIET });
    tags.push({ x: part.x0 - 4, y: y - 7, text: String(p.n), align: "right", w: 20, size: 7, color: RUSSET });
  });
  // Pull-ups: from the rail down to each open-drain line.
  pulled.forEach((p, i) => {
    const x = resistors[i];
    const y = sy(signals.indexOf(p));
    const [r0, r1] = [rail + 12, rail + 12 + 22];
    pen.line(x, rail, x, r0, INK, 1.1);
    pen.rect(x - 4, r0, 8, r1 - r0, { fill: PAPER, stroke: INK, strokeWidth: 1.1 });
    pen.line(x, r1, x, y, INK, 1.1);
    dot(x, rail);
    dot(x, y);
    tags.push({ x: x + 7, y: r0 + 5, text: `R${i + 1}`, align: "left", w: 26, size: 7.5, weight: 600 });
    tags.push({ x: x + 7, y: r0 + 15, text: "4k7", align: "left", w: 26, size: 7.5, color: QUIET });
  });
  // Decoupling: C1 from the rail to ground, by the part.
  const capY = (top + bottom) / 2;
  pen.line(capX, rail, capX, capY - 3, INK, 1.1);
  pen.line(capX - 9, capY - 3, capX + 9, capY - 3, INK, 1.6);
  pen.line(capX - 9, capY + 3, capX + 9, capY + 3, INK, 1.6);
  pen.line(capX, capY + 3, capX, ground0, INK, 1.1);
  earth(capX, ground0);
  tags.push({ x: capX + 13, y: capY - 6, text: "C1", align: "left", w: 40, size: 7.5, weight: 600 });
  tags.push({ x: capX + 13, y: capY + 5, text: "100n", align: "left", w: 40, size: 7.5, color: QUIET });

  return {
    width: right,
    height,
    el: <Drawing width={right} height={height} title={`A typical application: a host's I²C pins wired to ${d.part}, with pull-up resistors to 3.3 V and a 100 nF capacitor across the supply.`} pen={pen} tags={tags} />,
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Figure 5: the outline, dimensioned, with the board's edge below it                                */
/* ------------------------------------------------------------------------------------------------ */

const mm = (n: number, digits = 1) => n.toFixed(Math.abs(n * 10 - Math.round(n * 10)) > 1e-6 ? 2 : digits);

function DimensionDrawing({ d, width }: { d: Datasheet; width: number }) {
  const { board, pins } = d;
  const pen = new Pen();
  const tags: Tag[] = [];
  const pads = padsOf(board, pins.length);
  const holes = holesOf(board, pads);
  const leftRoom = 88;
  const rightRoom = 88;
  const scale = SCALES.find((k) => board.width * k * MM <= width - leftRoom - rightRoom && board.height * k * MM <= 250) ?? 1;
  const s = scale * MM;
  const ox = leftRoom;
  const oy = holes.length && board.edges === "two" && holes.length === 4 ? 48 : 34;
  const X = (v: number) => ox + v * s;
  const Y = (v: number) => oy + v * s;
  const x1 = X(board.width);
  const y1 = Y(board.height);
  drawBoard(pen, board, pins, ox, oy, s, false);
  // Centre marks on the holes.
  for (const [hx, hy] of holes) {
    const r = (board.hole / 2 + 0.9) * s;
    pen.line(X(hx) - r, Y(hy), X(hx) + r, Y(hy), INK, 0.4);
    pen.line(X(hx), Y(hy) - r, X(hx), Y(hy) + r, INK, 0.4);
  }
  const ext = (xa: number, ya: number, xb: number, yb: number) => pen.line(xa, ya, xb, yb, INK, 0.4);

  // Across the top: the holes' spacing, where they're side by side, then the overall width.
  const across = holes.filter(([, hy]) => Math.abs(hy - holes[0][1]) < 1e-6);
  let yw = oy - 18;
  if (across.length >= 2) {
    const [ha, hb] = [Math.min(...across.map((h) => h[0])), Math.max(...across.map((h) => h[0]))];
    ext(X(ha), Y(across[0][1]) - (board.hole / 2 + 1) * s, X(ha), yw - 4);
    ext(X(hb), Y(across[0][1]) - (board.hole / 2 + 1) * s, X(hb), yw - 4);
    dimX(pen, tags, X(ha), X(hb), yw, mm(hb - ha));
    yw -= 18;
  }
  ext(X(0), oy - 3, X(0), yw - 4);
  ext(x1, oy - 3, x1, yw - 4);
  dimX(pen, tags, X(0), x1, yw, mm(board.width));

  // Down the right: the holes' spacing, where they're one over the other, then the overall height.
  const right = holes.filter(([hx]) => Math.abs(hx - Math.max(...holes.map((h) => h[0]))) < 1e-6);
  let xh = x1 + 20;
  if (right.length >= 2) {
    const [ha, hb] = [Math.min(...right.map((h) => h[1])), Math.max(...right.map((h) => h[1]))];
    ext(X(right[0][0]) + (board.hole / 2 + 1) * s, Y(ha), xh + 4, Y(ha));
    ext(X(right[0][0]) + (board.hole / 2 + 1) * s, Y(hb), xh + 4, Y(hb));
    dimY(pen, tags, Y(ha), Y(hb), xh, mm(hb - ha));
    xh += 30;
  }
  ext(x1 + 3, oy, xh + 4, oy);
  ext(x1 + 3, y1, xh + 4, y1);
  dimY(pen, tags, oy, y1, xh, mm(board.height));

  // Down the left: pad 1 from the top edge, the pitch, and the pads' span.
  const left = pads.filter((p) => p.side === "left");
  if (left.length >= 2) {
    const [p1, p2, pn] = [left[0], left[1], left[left.length - 1]];
    const xa = ox - 22;
    ext(ox - 3, oy, xa - 4, oy);
    for (const p of [p1, p2]) ext(ox - (HALF_HOLE * s + 2), Y(p.y), xa - 4, Y(p.y));
    dimY(pen, tags, oy, Y(p1.y), xa, mm(p1.y, 2), "left");
    dimY(pen, tags, Y(p1.y), Y(p2.y), xa, mm(PITCH, 2), "left");
    const xb = ox - 58;
    ext(xa - 6, Y(p1.y), xb - 4, Y(p1.y));
    ext(ox - (HALF_HOLE * s + 2), Y(pn.y), xb - 4, Y(pn.y));
    dimY(pen, tags, Y(p1.y), Y(pn.y), xb, mm(pn.y - p1.y, 2));
  }
  // The holes: their size, by a leader from the lowest right-hand one; and its distance from the edge.
  if (holes.length) {
    const [hx, hy] = holes.reduce((a, b) => (b[1] > a[1] || (b[1] === a[1] && b[0] > a[0]) ? b : a));
    const r = (board.hole / 2) * s;
    const a = Math.PI / 4;
    const [sx, sy] = [X(hx) + Math.cos(a) * r, Y(hy) + Math.sin(a) * r];
    const knee: Pt = [x1 + 16, y1 + 22];
    pen.line(knee[0], knee[1], sx, sy, INK, 0.6);
    pen.arrow(sx, sy, sx - knee[0], sy - knee[1], INK, 5, 1.6);
    pen.line(knee[0], knee[1], knee[0] + 10, knee[1], INK, 0.6);
    tags.push({ x: knee[0] + 13, y: knee[1], text: `Ø${mm(board.hole)} × ${holes.length}`, align: "left", w: 64, size: 8 });
    const yb = y1 + 18;
    ext(X(hx), Y(hy) + r + 3, X(hx), yb + 4);
    ext(x1, y1 + 3, x1, yb + 4);
    dimX(pen, tags, X(hx), x1, yb, mm(board.width - hx));
  }

  // Below: the board edge-on, the parts on top of it, the castellations at its end.
  const gap = 46;
  const ey = y1 + gap + board.parts * s;
  const t = board.thickness * s;
  pen.rect(X(0), ey, board.width * s, t, { fill: BOARD, stroke: INK, strokeWidth: 1.1 });
  pen.rect(X(0), ey, 0.35 * s, t, { fill: RUSSET });
  if (board.edges === "two") pen.rect(x1 - 0.35 * s, ey, 0.35 * s, t, { fill: RUSSET });
  // Seen edge-on, each part is as tall as it stands, the tallest at the board's own figure for its parts.
  const parts = partsOf(board, pads, holes);
  const low = Math.min(board.parts, 0.8);
  const chip = Math.min(board.parts, 0.5);
  for (const [cx] of parts.caps) {
    const w = parts.capsVertical ? 0.8 : 1.6;
    pen.rect(X(cx - w / 2), ey - chip * s, w * s, chip * s, { fill: "#D3CAB8", stroke: METAL, strokeWidth: 0.5 });
  }
  if (parts.decouple) pen.rect(X(parts.decouple[0] - 0.8), ey - chip * s, 1.6 * s, chip * s, { fill: "#D3CAB8", stroke: METAL, strokeWidth: 0.5 });
  if (parts.regulator) pen.rect(X(parts.regulator[0] - 1.45), ey - low * s, 2.9 * s, low * s, { fill: PART });
  if (parts.sensor) pen.rect(X(parts.sensor[0] - 1.5), ey - board.parts * s, 3 * s, board.parts * s, { fill: PART });
  ext(ox - 3, ey, ox - 20, ey);
  ext(ox - 3, ey + t, ox - 54, ey + t);
  dimY(pen, tags, ey, ey + t, ox - 16, mm(board.thickness), "left");
  const tallest = parts.sensor ? X(parts.sensor[0] - 1.5) : parts.regulator ? X(parts.regulator[0] - 1.45) : undefined;
  if (tallest !== undefined && board.parts > 0) {
    ext(tallest - 3, ey - board.parts * s, ox - 54, ey - board.parts * s);
    dimY(pen, tags, ey - board.parts * s, ey + t, ox - 50, mm(board.thickness + board.parts), "left");
  }
  tags.push({ x: X(board.width / 2), y: ey + t + 14, text: "Side view", align: "center", w: 80, size: 7.5, color: QUIET, caps: true, tracking: 0.8 });

  const height = ey + t + 24;
  return {
    scale,
    height,
    el: <Drawing width={width} height={height} title={`${d.part}'s outline at ${ratio(scale)}: ${board.width} by ${board.height} mm, its holes and pads dimensioned, and the board edge-on below.`} pen={pen} tags={tags} />,
  };
}

/* ------------------------------------------------------------------------------------------------ */
/* Text, tables and their parts                                                                      */
/* ------------------------------------------------------------------------------------------------ */

/** A numbered section: its number in russet, its name, and a note at the right, over an ink rule. */
const section = (n: number, name: string, note?: ReactNode) => (
  <Row style={{ alignItems: "end", gap: 12, padding: [7, 0, 0], border: { top: hairline(INK) } }}>
    <Heading level={2} style={{ flex: "none", fontFamily: SANS, fontSize: 14, fontWeight: 600, lineHeight: "18px", letterSpacing: 0.1 }}>
      <Span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: RUSSET }}>{`${String(n).padStart(2, "0")}\u00A0\u00A0\u00A0`}</Span>
      {name}
    </Heading>
    {note ? <Text style={{ fontSize: 9.5, lineHeight: "18px", color: QUIET, textAlign: "right" }}>{note}</Text> : null}
  </Row>
);

/** A figure's or a table's caption: its number in mono capitals, then what it shows. */
const caption = (kind: string, n: number, text: string) => (
  <Text style={{ fontSize: 9.5, lineHeight: 1.4, color: QUIET }}>
    <Span style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase", color: INK }}>{`${kind} ${n}`}</Span>
    {"   "}
    {text}
  </Text>
);

const head = { ...label, padding: [0, 10, 5, 0], border: { bottom: hairline(INK) }, verticalAlign: "bottom" } as const;
const cell = { padding: [4.5, 10, 4.5, 0], border: { bottom: hairline() }, verticalAlign: "top" } as const;
const value = { fontFamily: MONO, fontSize: 9.5, lineHeight: "15px" } as const;
const table = { fontSize: 11, lineHeight: "15px" } as const;
const dash = <Span style={{ color: RULE_DARK }}>–</Span>;
const or = (v: string | undefined) => (v ? v : dash);

function PinTable({ pins, from = 0 }: { pins: Pin[]; from?: number }) {
  return (
    <Table style={table}>
      <TableRow header>
        <TableCell style={{ ...head, width: 44 }}>Pin</TableCell>
        <TableCell style={{ ...head, width: 72 }}>Name</TableCell>
        <TableCell style={{ ...head, width: 78 }}>Type</TableCell>
        <TableCell style={{ ...head, padding: [0, 0, 5] }}>Description</TableCell>
      </TableRow>
      {pins.map((p, i) => (
        <TableRow key={i}>
          <TableCell style={{ ...cell, ...value, color: RUSSET, fontWeight: 600 }}>{String(from + i + 1)}</TableCell>
          <TableCell style={{ ...cell, ...value, fontWeight: 600 }}>{p.name}</TableCell>
          <TableCell style={{ ...cell, color: QUIET }}>{p.type}</TableCell>
          <TableCell style={{ ...cell, padding: [4.5, 0] }}>{nb(p.description)}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}

function RatingsTable({ ratings }: { ratings: Rating[] }) {
  const n = { ...cell, ...value, textAlign: "center" } as const;
  return (
    <Table style={table}>
      <TableRow header>
        <TableCell style={head}>Parameter</TableCell>
        <TableCell style={{ ...head, width: 76 }}>Symbol</TableCell>
        <TableCell style={{ ...head, width: 64, textAlign: "center" }}>Min</TableCell>
        <TableCell style={{ ...head, width: 64, textAlign: "center" }}>Max</TableCell>
        <TableCell style={{ ...head, width: 52, textAlign: "center", padding: [0, 0, 5] }}>Unit</TableCell>
      </TableRow>
      {ratings.map((r, i) => (
        <TableRow key={i}>
          <TableCell style={cell}>{r.parameter}</TableCell>
          <TableCell style={{ ...cell, ...value }}>{sym(r.symbol, 9.5)}</TableCell>
          <TableCell style={n}>{or(r.min)}</TableCell>
          <TableCell style={n}>{or(r.max)}</TableCell>
          <TableCell style={{ ...n, padding: [4.5, 0] }}>{r.unit}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}

function CharacteristicsTable({ rows }: { rows: Characteristic[] }) {
  const n = { ...value, textAlign: "center" } as const;
  return (
    <Table style={table}>
      <TableRow header>
        <TableCell style={{ ...head, width: 84 }}>Group</TableCell>
        <TableCell style={head}>Parameter</TableCell>
        <TableCell style={{ ...head, width: 56 }}>Symbol</TableCell>
        <TableCell style={{ ...head, width: 142 }}>Conditions</TableCell>
        <TableCell style={{ ...head, width: 50, textAlign: "center" }}>Min</TableCell>
        <TableCell style={{ ...head, width: 50, textAlign: "center" }}>Typ</TableCell>
        <TableCell style={{ ...head, width: 50, textAlign: "center" }}>Max</TableCell>
        <TableCell style={{ ...head, width: 44, textAlign: "center", padding: [0, 0, 5] }}>Unit</TableCell>
      </TableRow>
      {rows.map((r, i) => {
        const first = i === 0 || r.group !== rows[i - 1].group;
        const line = i === 0 ? undefined : { top: hairline(first ? RULE_DARK : RULE) };
        const c = { padding: [4.5, 10, 4.5, 0], verticalAlign: "top", border: line } as const;
        return (
          <TableRow key={i}>
            <TableCell style={{ ...c, border: first ? line : undefined, fontWeight: 500 }}>{first ? r.group ?? "" : ""}</TableCell>
            <TableCell style={c}>{r.parameter}</TableCell>
            <TableCell style={{ ...c, ...value }}>{sym(r.symbol, 9.5)}</TableCell>
            <TableCell style={{ ...c, color: QUIET }}>{nb(r.conditions ?? "")}</TableCell>
            <TableCell style={{ ...c, ...n }}>{or(r.min)}</TableCell>
            <TableCell style={{ ...c, ...n }}>{or(r.typ)}</TableCell>
            <TableCell style={{ ...c, ...n }}>{or(r.max)}</TableCell>
            <TableCell style={{ ...c, ...n, padding: [4.5, 0] }}>{r.unit ?? ""}</TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
}

function TimingTable({ mode }: { mode: I2cMode }) {
  const n = { ...cell, ...value, textAlign: "center" } as const;
  return (
    <Table style={table}>
      <TableRow header>
        <TableCell style={{ ...head, width: 70 }}>Symbol</TableCell>
        <TableCell style={head}>Parameter</TableCell>
        <TableCell style={{ ...head, width: 46, textAlign: "center" }}>Min</TableCell>
        <TableCell style={{ ...head, width: 46, textAlign: "center" }}>Max</TableCell>
        <TableCell style={{ ...head, width: 38, textAlign: "center", padding: [0, 0, 5] }}>Unit</TableCell>
      </TableRow>
      {I2C_TIMING[mode].map(([symbol, parameter, min, max, unit]) => (
        <TableRow key={symbol}>
          <TableCell style={{ ...cell, ...value }}>{sym(symbol, 9.5)}</TableCell>
          <TableCell style={cell}>{parameter}</TableCell>
          <TableCell style={n}>{or(min)}</TableCell>
          <TableCell style={n}>{or(max)}</TableCell>
          <TableCell style={{ ...n, padding: [4.5, 0] }}>{unit}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}

/** A few rows of a Table, in plain columns: ordering and revisions. */
function SimpleTable({ heads, widths, rows, mono = [] }: { heads: string[]; widths: Array<number | undefined>; rows: string[][]; mono?: number[] }) {
  const last = heads.length - 1;
  return (
    <Table style={table}>
      <TableRow header>
        {heads.map((h, i) => (
          <TableCell key={h} style={{ ...head, ...(widths[i] ? { width: widths[i] } : {}), ...(i === last ? { padding: [0, 0, 5] } : {}) }}>
            {h}
          </TableCell>
        ))}
      </TableRow>
      {rows.map((r, j) => (
        <TableRow key={j}>
          {r.map((v, i) => (
            <TableCell key={i} style={{ ...cell, ...(mono.includes(i) ? { ...value, fontWeight: 600 } : {}), ...(i === last ? { padding: [4.5, 0] } : {}) }}>
              {nb(v)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </Table>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* The datasheet                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------------------------------ */
/* Fitting it to pages                                                                               */
/* ------------------------------------------------------------------------------------------------ */

/**
 * A PDF's pages don't flow: what doesn't fit is cut off. So each part of the datasheet says how tall it will be, from
 * its data, and the parts are laid onto pages in order: a part that doesn't fit starts the next page, and a table
 * breaks between its rows, its header repeated. Text is measured by a careful guess (Barlow averages under half its
 * size per character); drawings and table rows know their heights exactly.
 */
const linesOf = (text: string, width: number, size: number) => Math.max(1, Math.ceil((text.length * size * 0.44) / (width - size)));

/** The height between the running header and footer, less the space over the first part. */
const ROOM = { A4: 1123 - 38 - 30 - 26 - 22, Letter: 1056 - 38 - 30 - 26 - 22 } as const;
const SECTION_H = 26;
const CAPTION_H = 14;
const HEAD_H = 17;
const ROW_H = 25;
const LINE_H = 15;

type Part = { group: number; height: number; el: ReactElement } | { group: number; table: { rows: number[]; head: number; foot: number; draw: (from: number, to: number) => ReactElement } };

function paginate(parts: Part[], room: number, gap: number): ReactElement[][] {
  const pages: ReactElement[][] = [];
  let page: ReactElement[] = [];
  let used = 0;
  let group = -1;
  let spilled = false;
  const turn = () => {
    if (page.length) pages.push(page);
    page = [];
    used = 0;
  };
  const add = (el: ReactElement, height: number) => {
    used += (page.length ? gap : 0) + height;
    page.push(el);
  };
  const free = () => room - used - (page.length ? gap : 0);
  for (const part of parts) {
    // Each group of parts starts a page, unless the one before spilled onto a page of its own.
    if (part.group !== group) {
      if (!spilled) turn();
      group = part.group;
      spilled = false;
    }
    if ("el" in part) {
      if (page.length && part.height > free()) {
        turn();
        spilled = true;
      }
      add(part.el, part.height);
      continue;
    }
    const { rows, head, foot, draw } = part.table;
    let i = 0;
    while (i < rows.length) {
      let n = 0;
      let h = head + foot;
      while (i + n < rows.length && h + rows[i + n] <= free()) h += rows[i + n++];
      if (i + n === rows.length || (n >= 3 && rows.length - i - n >= 2)) {
        add(draw(i, i + n), h);
        i += n;
        if (i < rows.length) {
          turn();
          spilled = true;
        }
      } else {
        turn();
        spilled = true;
      }
    }
  }
  turn();
  return pages;
}

export default function WrenWr2Datasheet(props: WrenDatasheetProps = {}) {
  const { size = "A4", ...given } = props;
  const d: Datasheet = { ...WR2, ...given };
  const W = PAPER_SIZE[size].width - 2 * SIDE;
  const gap = size === "A4" ? 30 : 22;
  const top = gap - 8;
  const half = (W - GAP) / 2;
  const left = 236;
  const fig1 = BoardFigure({ d, width: W - left - GAP });
  const schematic = Schematic({ d, width: W });
  const outline = DimensionDrawing({ d, width: W - 196 - GAP });
  const url = `wren.example/${d.part.toLowerCase()}`;
  const textSize = { fontSize: 11.5, lineHeight: 1.45 } as const;
  const TEXT_H = 11.5 * 1.45;
  const chartH = size === "A4" ? 200 : 160;

  // 1: what it is, the board and its pins.
  const titleH = Math.max(11 + 12 + 72 + 4 + 31 + 12 + linesOf(d.summary, 330, 13.5) * 19.6, Math.ceil(d.highlights.length / 2) * 44 + 14);
  const title = (
    <Row style={{ alignItems: "end", gap: GAP }}>
      <Column style={{ gap: 12 }}>
        <Text style={label}>{`Datasheet · Revision ${d.revision} · ${month(d.date)}`}</Text>
        <Column style={{ gap: 4 }}>
          <Heading level={1} style={{ fontSize: 78, fontWeight: 600, lineHeight: 0.92, letterSpacing: -2.4 }}>
            {d.part}
          </Heading>
          <Text style={{ fontSize: 27, fontWeight: 300, lineHeight: 1.15, letterSpacing: -0.3 }}>{d.name}</Text>
        </Column>
        <Text style={{ fontSize: 13.5, lineHeight: 1.45, color: QUIET, maxWidth: 330 }}>{nb(d.summary)}</Text>
      </Column>
      <Grid columns={2} style={{ width: 296, gap: 18, rowGap: 14 }}>
        {d.highlights.map((h, i) => (
          <Column key={i} style={{ gap: 3, padding: [8, 0, 0], border: { top: hairline(i < 2 ? INK : RULE) } }}>
            <Text style={{ fontSize: 21, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.3 }}>{nb(h.value)}</Text>
            <Text style={{ ...label, fontSize: 7.5, letterSpacing: 0.6 }}>{nb(h.label)}</Text>
          </Column>
        ))}
      </Grid>
    </Row>
  );

  const leftH =
    3 * (SECTION_H + 8) +
    2 * 18 +
    d.features.reduce((sum, f) => sum + linesOf(f, left - 13, 11.5) * TEXT_H, 0) +
    3 * (d.features.length - 1) +
    linesOf(d.applications.join(" · "), left, 11.5) * TEXT_H +
    linesOf(d.description, left, 11.5) * TEXT_H;
  const overview = (
    <Row style={{ gap: GAP, alignItems: "start" }}>
      <Column style={{ width: left, gap: 18 }}>
        <Column style={{ gap: 8 }}>
          {section(1, "Features")}
          <List style={{ ...textSize, width: left, gap: 3, indent: 13 }}>
            {d.features.map((f, i) => (
              <ListItem key={i}>{nb(f)}</ListItem>
            ))}
          </List>
        </Column>
        <Column style={{ gap: 8 }}>
          {section(2, "Applications")}
          <Text style={textSize}>{d.applications.map(nb).join(" · ")}</Text>
        </Column>
        <Column style={{ gap: 8 }}>
          {section(3, "Description")}
          <Text style={textSize}>{nb(d.description)}</Text>
        </Column>
      </Column>
      <Column style={{ gap: 10 }}>
        {section(4, "Pins", "Top view")}
        {fig1.el}
        {caption("Figure", 1, `${d.part} from above at ${ratio(fig1.scale)}. Each pad is drawn and called out from table 1.`)}
      </Column>
    </Row>
  );

  const pinRows = d.pins.map((p) => ROW_H + (linesOf(p.description, W - 194, 11) - 1) * LINE_H);
  const pinTable = (from: number, to: number) => (
    <Column style={{ gap: 8 }}>
      {from > 0 ? section(4, "Pins", "Continued") : null}
      <PinTable pins={d.pins.slice(from, to)} from={from} />
      {caption("Table", 1, to < d.pins.length ? "Pin functions, continued overleaf." : "Pin functions. Pin 1 is marked on the board by a triangle.")}
    </Column>
  );

  // 2: the limits and the characteristics.
  const ratings = (
    <Column style={{ gap: 10 }}>
      {section(5, "Absolute maximum ratings")}
      <RatingsTable ratings={d.ratings} />
      {caption("Table", 2, "Absolute maximum ratings. Beyond them the board may be damaged; they are not conditions to run it at.")}
    </Column>
  );
  const ratingsH = SECTION_H + 10 + HEAD_H + d.ratings.reduce((sum, r) => sum + ROW_H + (linesOf(r.parameter, W - 256, 11) - 1) * LINE_H, 0) + 10 + CAPTION_H;
  const paramW = W - 84 - 56 - 142 - 150 - 44;
  const charRows = d.characteristics.map((r) => ROW_H + (Math.max(linesOf(r.parameter, paramW, 11), linesOf(r.conditions ?? "", 142, 11)) - 1) * LINE_H);
  const characteristics = (from: number, to: number) => (
    <Column style={{ gap: 10 }}>
      {section(6, "Electrical characteristics", from > 0 ? "Continued" : <>T{sym("_A", 9.5)} = 25 °C and V{sym("_IN", 9.5)} = 3.3 V unless noted</>)}
      <CharacteristicsTable rows={d.characteristics.slice(from, to)} />
      {caption("Table", 3, to < d.characteristics.length ? "Electrical characteristics, continued overleaf." : "Typical values are the median of production; limits are tested on every board.")}
    </Column>
  );
  const performance = (
    <Column style={{ gap: 12 }}>
      {section(7, "Typical performance")}
      <Row style={{ gap: GAP, alignItems: "start" }}>
        {d.curves.slice(0, 2).map((c, i) => (
          <Column key={i} style={{ width: half, gap: 8 }}>
            <CurveChart curve={c} width={half} height={chartH} />
            {caption("Figure", i + 2, `${c.title}, typical and limits.`)}
          </Column>
        ))}
      </Row>
    </Column>
  );

  // 3: the bus, and how to wire it.
  const bus = (
    <Column style={{ gap: 12 }}>
      {section(8, "I²C interface", `${d.i2c.mode} mode`)}
      <TimingDiagram width={W} />
      {caption("Figure", 4, "I²C timing. Times are measured between the edges the dashed lines mark; table 4 gives their limits.")}
    </Column>
  );
  const timing = (
    <Row style={{ gap: GAP, alignItems: "start" }}>
      <Column style={{ gap: 8 }}>
        <TimingTable mode={d.i2c.mode} />
        {caption("Table", 4, `I²C timing, ${d.i2c.mode.toLowerCase()} mode.`)}
      </Column>
      <Column style={{ width: 236, gap: 10 }}>
        {d.i2c.notes.map((note, i) => (
          <Text key={i} style={textSize}>
            {nb(note)}
          </Text>
        ))}
      </Column>
    </Row>
  );
  const timingH = Math.max(HEAD_H + 8 * ROW_H + 8 + CAPTION_H, d.i2c.notes.reduce((sum, n) => sum + linesOf(n, 236, 11.5) * TEXT_H + 10, -10));
  const application = (
    <Column style={{ gap: 12 }}>
      {section(9, "Typical application")}
      <Row style={{ gap: GAP, alignItems: "start" }}>
        <Column style={{ width: schematic.width, gap: 8 }}>
          {schematic.el}
          {caption("Figure", 5, `${d.part} on a host's I²C bus.`)}
        </Column>
        <Column style={{ gap: 10, padding: [4, 0, 0] }}>
          {d.application.map((note, i) => (
            <Text key={i} style={textSize}>
              {nb(note)}
            </Text>
          ))}
        </Column>
      </Row>
    </Column>
  );
  const applicationH = SECTION_H + 12 + Math.max(schematic.height + 8 + CAPTION_H, 4 + d.application.reduce((sum, n) => sum + linesOf(n, W - schematic.width - GAP, 11.5) * TEXT_H + 10, -10));

  // 4: the outline, ordering and history.
  const notes = [
    "Dimensions in millimetres. Outline ±0.2, holes and pads ±0.1.",
    "Castellated pads on a 2.54 mm pitch, with 1.0 mm half-holes, gold over nickel.",
    `FR-4, ${mm(d.board.thickness)} mm thick. Parts stand up to ${mm(d.board.parts)} mm above it.`,
    `Drawn at ${ratio(outline.scale)} when printed at 100 %.`,
  ];
  const mechanical = (
    <Column style={{ gap: 12 }}>
      {section(10, "Mechanical", "Dimensions in mm")}
      <Row style={{ gap: GAP, alignItems: "start" }}>
        <Column style={{ gap: 8 }}>{outline.el}</Column>
        <Column style={{ width: 196, gap: 14 }}>
          <Column style={{ gap: 5 }}>
            {notes.map((note, i) => (
              <Row key={i} style={{ gap: 6 }}>
                <Text style={{ width: 12, flex: "none", fontFamily: MONO, fontSize: 8, lineHeight: "14.5px", color: RUSSET }}>{String(i + 1)}</Text>
                <Text style={{ fontSize: 10, lineHeight: "14.5px", color: QUIET }}>{nb(note)}</Text>
              </Row>
            ))}
          </Column>
          <Column style={{ border: hairline(INK) }}>
            <Row style={{ gap: 8, alignItems: "center", padding: [7, 8], border: { bottom: hairline(INK) } }}>
              <MarkSvg size={14} />
              <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: 600, letterSpacing: 1.4, lineHeight: "14px" }}>WREN INSTRUMENTS</Text>
            </Row>
            {[
              ["Title", `${d.part} outline`, "Rev", d.revision],
              ["Scale", ratio(outline.scale), "Units", "mm"],
              ["Drawn", month(d.date), "Sheet", null],
            ].map(([a, av, b, bv], i) => (
              <Row key={i} style={{ border: i < 2 ? { bottom: hairline(RULE_DARK) } : undefined }}>
                <Column style={{ padding: [5, 8], gap: 1, border: { right: hairline(RULE_DARK) } }}>
                  <Text style={{ ...label, fontSize: 6.5 }}>{a}</Text>
                  <Text style={{ ...value, fontSize: 9, lineHeight: "13px" }}>{av}</Text>
                </Column>
                <Column style={{ width: 62, padding: [5, 8], gap: 1 }}>
                  <Text style={{ ...label, fontSize: 6.5 }}>{b}</Text>
                  <Text style={{ ...value, fontSize: 9, lineHeight: "13px", color: b === "Rev" ? RUSSET : INK, fontWeight: b === "Rev" ? 600 : 400 }}>
                    {bv ?? (
                      <>
                        <PageNumber /> / <PageNumber total />
                      </>
                    )}
                  </Text>
                </Column>
              </Row>
            ))}
          </Column>
        </Column>
      </Row>
      {caption("Figure", 6, `${d.part} outline, from above and edge-on.`)}
    </Column>
  );
  const notesH = notes.reduce((sum, n) => sum + linesOf(n, 178, 10) * 14.5 + 5, -5) + 14 + 30 + 3 * 37;
  const mechanicalH = SECTION_H + 12 + Math.max(outline.height, notesH) + 12 + CAPTION_H;
  const simpleH = (rows: string[][], wide: number) => SECTION_H + 10 + HEAD_H + rows.reduce((sum, r) => sum + ROW_H + (Math.max(...r.map((v) => linesOf(v, wide, 11))) - 1) * LINE_H, 0);
  const orders = d.ordering.map((o) => [o.part, o.description, o.pack]);
  const ordering = (
    <Column style={{ gap: 10 }}>
      {section(11, "Ordering")}
      <SimpleTable heads={["Part number", "Description", "Pack"]} widths={[120, undefined, 110]} rows={orders} mono={[0]} />
    </Column>
  );
  const history = d.revisions.map((r) => [r.rev, month(r.date), r.changes]);
  const revisions = (
    <Column style={{ gap: 10 }}>
      {section(12, "Revision history")}
      <SimpleTable heads={["Rev", "Date", "Changes"]} widths={[120, 110, undefined]} rows={history} mono={[0]} />
    </Column>
  );
  const legalText = `Wren Instruments makes ${d.part} for monitoring and control, not for life support or any use where its failure could hurt someone. These specifications may change without notice; the current revision is always at ${url}. © ${d.date.slice(0, 4)} Wren Instruments Ltd.`;
  const legal = <Text style={{ fontSize: 9, lineHeight: 1.5, color: QUIET, padding: [10, 0, 0], border: { top: hairline() } }}>{legalText}</Text>;

  const pages = paginate(
    [
      { group: 1, height: titleH, el: title },
      { group: 1, height: Math.max(leftH, SECTION_H + 10 + fig1.height + 10 + CAPTION_H), el: overview },
      { group: 1, table: { rows: pinRows, head: HEAD_H, foot: 8 + CAPTION_H, draw: pinTable } },
      { group: 2, height: ratingsH, el: ratings },
      { group: 2, table: { rows: charRows, head: SECTION_H + 10 + HEAD_H, foot: 10 + CAPTION_H, draw: characteristics } },
      { group: 2, height: SECTION_H + 12 + chartH + 8 + CAPTION_H, el: performance },
      { group: 3, height: SECTION_H + 12 + 166 + 12 + CAPTION_H, el: bus },
      { group: 3, height: timingH, el: timing },
      { group: 3, height: applicationH, el: application },
      { group: 4, height: mechanicalH, el: mechanical },
      { group: 4, height: simpleH(orders, W - 230), el: ordering },
      { group: 4, height: simpleH(history, W - 230), el: revisions },
      { group: 4, height: 11 + linesOf(legalText, W, 9) * 13.5, el: legal },
    ],
    ROOM[size] - top - 6,
    gap,
  );

  return (
    <Document
      size={size}
      margin={[38, SIDE, 30, SIDE]}
      title={`${d.part} ${d.name}, datasheet, revision ${d.revision}`}
      lang="en-GB"
      fonts={FONTS}
      style={{ backgroundColor: PAPER, color: INK, fontFamily: SANS, fontSize: 11.5, lineHeight: 1.45 }}
    >
      <PageHeader style={{ padding: [0, 0, 9], border: { bottom: hairline(INK) } }}>
        <Row style={{ alignItems: "center", gap: 10 }}>
          <MarkSvg size={16} />
          <Text style={{ flex: "none", fontFamily: MONO, fontSize: 8.5, fontWeight: 600, letterSpacing: 1.6, lineHeight: "16px" }}>WREN</Text>
          <Text style={{ fontFamily: MONO, fontSize: 8.5, lineHeight: "16px", color: QUIET, textAlign: "right" }}>
            <Span style={{ color: INK, fontWeight: 600 }}>{d.part}</Span> Datasheet{"   ·   "}
            <Span style={{ color: RUSSET, fontWeight: 600 }}>Rev {d.revision}</Span>
          </Text>
        </Row>
      </PageHeader>

      {pages.map((parts, i) => (
        <Document.Page key={i}>
          <Column style={{ gap, padding: [top, 0, 0] }}>{parts.map((part, j) => (
              <Column key={j}>{part}</Column>
            ))}</Column>
        </Document.Page>
      ))}

      <PageFooter style={{ padding: [9, 0, 0], border: { top: hairline() } }}>
        <Row style={{ gap: 16, alignItems: "center" }}>
          <Text style={{ fontFamily: MONO, fontSize: 8, color: QUIET, lineHeight: "12px" }}>{url}</Text>
          <Text style={{ fontFamily: MONO, fontSize: 8, color: QUIET, lineHeight: "12px", textAlign: "center" }}>{`${d.part} · Rev ${d.revision} · ${month(d.date)}`}</Text>
          <Text style={{ fontFamily: MONO, fontSize: 8, color: QUIET, lineHeight: "12px", textAlign: "right" }}>
            Page <PageNumber /> of <PageNumber total />
          </Text>
        </Row>
      </PageFooter>
    </Document>
  );
}
