import wr2 from "../designs/wr-2.values.json";
import wr4 from "../designs/wr-4.values.json";
import type { Datasheet, Pin } from "../src/wren-wr2-datasheet";
import type { Paper } from "./contracts";

export const steps = ["Start", "Part", "Pins", "Board", "I²C bus", "Export"] as const;
export type Step = (typeof steps)[number];

export const examples = { "WR-2": wr2.values as Datasheet, "WR-4": wr4.values as Datasheet };
export type Example = keyof typeof examples;

type BoardDraft = Partial<Pick<Datasheet["board"], "width" | "height" | "thickness">> &
  Pick<Datasheet["board"], "edges">;
export type DraftPin = Pin & { key: number };
export type Draft = Pick<Datasheet, "part" | "name" | "revision" | "date" | "summary" | "highlights"> & {
  pins: DraftPin[];
  board: BoardDraft;
  i2c: Omit<Datasheet["i2c"], "notes">;
  advanced: string;
};

const partFields = ["part", "name", "revision", "date", "summary"] as const;
const boardFields = ["width", "height", "thickness", "edges"] as const;
const i2cFields = ["mode", "pullUpOhms", "busCapacitancePf"] as const;
export const pinTypes = ["Power", "Ground", "I/O", "Input", "Output"] as const;
export const busModes = ["Standard", "Fast", "Fast-mode Plus"] as const;
export const padPitch = 2.54;

export function makeDraft(example: Example): Draft {
  const values = examples[example];
  const { part, name, revision, date, summary, highlights, pins, board, i2c, ...advanced } = values;
  const { width, height, thickness, edges, ...extraBoard } = board;
  const { mode, pullUpOhms, busCapacitancePf, ...extraI2c } = i2c;
  return {
    part, name, revision, date, summary, highlights,
    pins: pins.map((pin, key) => ({ ...pin, key })),
    board: { width, height, thickness, edges },
    i2c: { mode, pullUpOhms, busCapacitancePf },
    advanced: JSON.stringify({ ...advanced, board: extraBoard, i2c: extraI2c }, null, 2),
  };
}

function isRecord(item: unknown): item is Record<string, unknown> {
  return !!item && typeof item === "object" && !Array.isArray(item);
}

export function assemble(draft: Draft): { error: string } | { values: Record<string, unknown> } {
  const { advanced, pins, board, i2c, ...part } = draft;
  let json: unknown;
  try {
    json = JSON.parse(advanced);
  } catch (error) {
    return { error: error instanceof SyntaxError ? error.message : "Enter valid JSON." };
  }

  if (!isRecord(json)) return { error: "Enter a JSON object starting with { and ending with }." };
  for (const field of [...partFields, "highlights", "pins"]) {
    if (Object.hasOwn(json, field)) return { error: `Edit ${field} in its own step.` };
  }
  for (const [field, keys] of [["board", boardFields], ["i2c", i2cFields]] as const) {
    if (!Object.hasOwn(json, field)) continue;
    const group = json[field];
    if (!isRecord(group)) return { error: `Enter ${field} as a JSON object.` };
    for (const key of keys) {
      if (Object.hasOwn(group, key)) return { error: `Edit ${field}.${key} in its own step.` };
    }
  }

  return {
    values: {
      ...json,
      ...part,
      pins: pins.map(({ key: _key, ...pin }) => pin),
      board: { ...json.board as Record<string, unknown> | undefined, ...board },
      i2c: { ...json.i2c as Record<string, unknown> | undefined, ...i2c },
    },
  };
}

export function stepFor(field: string | null): Step {
  if (!field) return "Export";
  const top = field.split(/[.\[]/, 1)[0];
  if (partFields.some((key) => key === top) || top === "highlights") return "Part";
  if (top === "pins") return "Pins";
  if (field === "board" || boardFields.some((key) => field === `board.${key}`)) return "Board";
  if (field === "i2c" || i2cFields.some((key) => field === `i2c.${key}`)) return "I²C bus";
  return "Export";
}

export function focusField(field: string | null): string {
  const step = stepFor(field);
  if (step === "Export") return field ? "advanced" : "export-heading";
  if (field === "board") return "board.height";
  if (field === "i2c") return "i2c.mode";
  if (field?.match(/^(pins|highlights)\[\d+\]$/)) {
    return field + (step === "Pins" ? ".name" : ".value");
  }
  return field ?? "export-heading";
}

export type SavedDraft = { example: Example; format: Paper; draft: Draft };

export function readSavedDraft(raw: string): SavedDraft | null {
  const saved: unknown = JSON.parse(raw);
  if (!isRecord(saved) || (saved.example !== "WR-2" && saved.example !== "WR-4") ||
    (saved.format !== "a4" && saved.format !== "letter") || !isRecord(saved.draft)) return null;
  const draft = saved.draft;
  const { board, i2c, pins, highlights } = draft;
  const optionalNumber = (value: unknown) => value === undefined || (typeof value === "number" && Number.isFinite(value));
  if (typeof draft.advanced !== "string" || !partFields.every((field) => typeof draft[field] === "string") ||
    !isRecord(board) || (board.edges !== "one" && board.edges !== "two") ||
    ![board.width, board.height, board.thickness].every(optionalNumber) ||
    !isRecord(i2c) || !busModes.some((mode) => mode === i2c.mode) ||
    ![i2c.pullUpOhms, i2c.busCapacitancePf].every(optionalNumber) ||
    !Array.isArray(highlights) || highlights.length !== 4 ||
    !highlights.every((item) => isRecord(item) && typeof item.value === "string" && typeof item.label === "string") ||
    !Array.isArray(pins) || pins.length > 12 ||
    !pins.every((pin) => isRecord(pin) && Number.isSafeInteger(pin.key) && typeof pin.name === "string" &&
      pinTypes.some((type) => type === pin.type) && typeof pin.description === "string" &&
      (pin.pullUp === undefined || typeof pin.pullUp === "boolean")) ||
    new Set(pins.map((pin) => pin.key)).size !== pins.length
  ) return null;
  return { example: saved.example, format: saved.format, draft: draft as Draft };
}

export function makeSubmission(values: Record<string, unknown>, format: Paper) {
  return JSON.stringify({ values, format });
}
