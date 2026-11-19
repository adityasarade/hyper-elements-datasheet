import type { InputHTMLAttributes, ReactNode } from "react";
import { i2cPullUp, type Pin } from "../src/wren-wr2-datasheet";
import { paperLabels, type FieldGuides, type Paper, type StudioDiagnostic } from "./contracts";
import { busModes, examples, padPitch, pinTypes, stepFor, type Draft, type DraftPin, type Example, type Step } from "./draft";
import { BoardIcon, Icon } from "./icons";

export type ExportKind = "pdf" | "values";
type Context = { guides: FieldGuides; diagnostics: StudioDiagnostic[] };

function errorMatches(diagnostic: StudioDiagnostic, field: string) {
  if (field === "advanced") return diagnostic.field !== null && stepFor(diagnostic.field) === "Export";
  if (field === "i2c.busCapacitancePf" && diagnostic.code === "template/render") {
    return diagnostic.field === "i2c.pullUpOhms";
  }
  if (/^(pins|highlights)\[\d+\]\.(name|value)$/.test(field) && diagnostic.field === field.slice(0, field.lastIndexOf("."))) {
    return true;
  }
  return diagnostic.field === field;
}

/** A message for a person: without the field path the template puts first for tools ("revision: …"). */
export function plain(message: string) {
  const text = message
    .replace(/^i2c\.pullUpOhms and i2c\.busCapacitancePf give/, "This resistance and capacitance give")
    .replace(/^[a-zA-Z]+(\[\d+\])?(\.[a-zA-Z]+(\[\d+\])?)*:\s+/, "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function fieldState({ diagnostics, guides }: Context, field: string) {
  const control = { id: field, name: field };
  const guide = guides[field.replace(/\[\d+\]/g, "[]")];
  const messages = diagnostics.filter((diagnostic) => errorMatches(diagnostic, field));
  const description = messages.length ? `${field}-problems` : undefined;
  return {
    attrs: { ...control, "aria-invalid": messages.some(({ severity }) => severity === "error") || undefined, "aria-describedby": description },
    guide,
    problems: messages.length > 0 && (
      <ul className="field-problems" id={description}>
        {messages.map((item, index) => <li key={index}>{plain(item.message)}</li>)}
      </ul>
    ),
  };
}

type InputProps = {
  context: Context;
  field: string;
  label?: string;
  labelHidden?: boolean;
  mono?: boolean;
} & Pick<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "placeholder" | "step" | "className" | "aria-invalid" | "aria-describedby">;

function Input({ context, field, label, labelHidden, mono, className = "", ...input }: InputProps) {
  const { attrs, guide, problems } = fieldState(context, field);
  return (
    <div className={`field ${className}`}>
      <label htmlFor={field} className={labelHidden ? "visually-hidden" : undefined}>{label ?? guide?.label}</label>
      <input
        {...attrs}
        {...input}
        className={mono ? "mono" : undefined}
        aria-required={guide?.required || undefined}
        maxLength={guide?.maxLength}
      />
      {problems}
    </div>
  );
}

function Select({ context, field, label, labelHidden, value, onChange, children, dot, className = "" }: {
  context: Context; field: string; label?: string; labelHidden?: boolean; value: string;
  onChange: (value: string) => void; children: ReactNode; dot?: string; className?: string;
}) {
  const { attrs, guide, problems } = fieldState(context, field);
  return (
    <div className={`field ${className}`}>
      <label htmlFor={field} className={labelHidden ? "visually-hidden" : undefined}>{label ?? guide?.label}</label>
      <div className={dot ? "select-wrap with-dot" : "select-wrap"}>
        {dot && <span className={`type-dot ${dot}`} aria-hidden="true" />}
        <select {...attrs} aria-required={guide?.required || undefined} value={value} onChange={(event) => onChange(event.target.value)}>
          {children}
        </select>
        <Icon name="chevron" />
      </div>
      {problems}
    </div>
  );
}

export function PaperSize({ format, onChange, label = "Paper size" }: {
  format: Paper; onChange: (format: Paper) => void; label?: string;
}) {
  return (
    <div className="segmented paper-size" role="group" aria-label={label}>
      {(Object.keys(paperLabels) as Paper[]).map((paper) => (
        <button key={paper} type="button" aria-pressed={format === paper} onClick={() => onChange(paper)}>
          {paperLabels[paper]}
        </button>
      ))}
    </div>
  );
}

function StartFields({ example, choose, reset }: { example: Example; choose: (example: Example) => void; reset: () => void }) {
  return (
    <>
      <div className="example-options" role="group" aria-label="Starting parts">
        {(Object.keys(examples) as Example[]).map((key) => {
          const values = examples[key];
          const twoEdges = values.board.edges === "two";
          return (
            <button key={key} type="button" className="example-card" aria-pressed={key === example} onClick={() => choose(key)}>
              <div className="example-illustration">
                <BoardIcon pins={values.pins.length} twoEdges={twoEdges} />
                <span className="example-radio" aria-hidden="true">{key === example && <Icon name="check" />}</span>
              </div>
              <strong>{key}</strong>
              <span className="example-name">{values.name}</span>
              <span className="example-meta">{values.pins.length} pins · {twoEdges ? "Two edges" : "One edge"}</span>
            </button>
          );
        })}
      </div>
      <button type="button" className="text-button reset-button" onClick={reset}><Icon name="reset" /> Reset</button>
    </>
  );
}

function PartFields({ context, draft, change }: { context: Context; draft: Draft; change: ChangeDraft }) {
  const summary = fieldState(context, "summary");
  const highlights = fieldState(context, "highlights");
  return (
    <>
      <div className="field-grid">
        <Input context={context} field="part" mono value={draft.part} onChange={(event) => change({ part: event.target.value.toUpperCase() })} />
        <Input context={context} field="name" value={draft.name} onChange={(event) => change({ name: event.target.value })} />
        <Input context={context} field="revision" mono value={draft.revision} onChange={(event) => change({ revision: event.target.value.toUpperCase() })} />
        <Input context={context} field="date" type="date" value={draft.date} onChange={(event) => change({ date: event.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="summary">Summary</label>
        <textarea {...summary.attrs} rows={3} maxLength={summary.guide?.maxLength} aria-required="true" value={draft.summary} onChange={(event) => change({ summary: event.target.value })} />
        {summary.problems}
      </div>
      <fieldset {...highlights.attrs} tabIndex={-1} className="highlight-fields">
        <legend>Highlights</legend>
        <p className="field-hint">{context.guides.highlights.guidance}</p>
        <div className="highlight-row highlight-column-labels" aria-hidden="true">
          <span>Value</span><span>Label</span>
        </div>
        {draft.highlights.map((highlight, index) => (
          <div className="highlight-row" key={index}>
            <span className="mono minor-index" aria-hidden="true">{index + 1}</span>
            {(["value", "label"] as const).map((key) => (
              <Input key={key} context={context} field={`highlights[${index}].${key}`}
                label={`Highlight ${index + 1} ${key}`} labelHidden mono={key === "value"}
                value={highlight[key]} onChange={(event) => change({
                  highlights: draft.highlights.map((item, position) =>
                    position === index ? { ...item, [key]: event.target.value } : item),
                })} />
            ))}
          </div>
        ))}
        {highlights.problems}
      </fieldset>
    </>
  );
}

const pinDots: Record<Pin["type"], string> = {
  Power: "power", Ground: "ground", "I/O": "io", Input: "input", Output: "output",
};

function PinFields({ context, pins, change, focus }: {
  context: Context; pins: DraftPin[]; change: (pins: DraftPin[]) => void; focus: (id: string) => void;
}) {
  const { minItems: min = 2, maxItems: max = 12 } = context.guides.pins;
  const list = fieldState(context, "pins");

  function update(index: number, patch: Partial<Pin>) {
    change(pins.map((pin, position) => position === index ? { ...pin, ...patch } : pin));
  }

  function move(index: number, offset: number) {
    const next = index + offset;
    const rows = [...pins];
    [rows[index], rows[next]] = [rows[next], rows[index]];
    change(rows);
    focus(`pins[${next}].name`);
  }

  function remove(index: number) {
    change(pins.filter((_, position) => position !== index));
    focus(`pins[${Math.min(index, pins.length - 2)}].name`);
  }

  return (
    <div className="pin-editor" id="tour-pins">
      <ol className="pin-list" aria-label="Board pins, in pad order">
        {pins.map((pin, index) => {
          const field = `pins[${index}]`;
          const description = fieldState(context, `${field}.description`);
          const pullUp = fieldState(context, `${field}.pullUp`);
          const canPullUp = pin.type === "I/O" || pin.type === "Input";
          const pullUpHint = canPullUp ? undefined : `${field}-pull-up-hint`;
          return (
            <li key={pin.key} className="pin-row">
              <span className="pin-number" aria-hidden="true">{index + 1}</span>
              <Input className="pin-name" context={context} field={`${field}.name`} label={`Pin ${index + 1} name`} labelHidden mono
                placeholder="NAME" value={pin.name} onChange={(event) => update(index, { name: event.target.value.toUpperCase() })} />
              <Select className="pin-type" context={context} field={`${field}.type`} label={`Pin ${index + 1} type`} labelHidden dot={pinDots[pin.type]}
                value={pin.type} onChange={(value) => {
                  const type = value as Pin["type"];
                  update(index, { type, pullUp: type === "Input" || type === "I/O" ? pin.pullUp : undefined });
                }}>
                {pinTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>
              <label className={`pin-pull ${canPullUp ? "" : "unavailable"}`} title={canPullUp ? undefined : "Only I/O and input pins take a pull-up"}>
                <input {...pullUp.attrs} type="checkbox" checked={pin.pullUp ?? false} disabled={!canPullUp}
                  aria-describedby={[pullUp.attrs["aria-describedby"], pullUpHint].filter(Boolean).join(" ") || undefined}
                  onChange={(event) => update(index, { pullUp: event.target.checked })} />
                Pull-up
                <span className="visually-hidden"> on pin {index + 1}</span>
                {pullUpHint && <span className="visually-hidden" id={pullUpHint}>
                  {pin.pullUp ? "Set by the example for this open-drain output." : "Only I/O and input pins take a pull-up."}
                </span>}
              </label>
              <div className="pin-actions">
                <button type="button" className="icon-button" title="Move up" aria-label={`Move pin ${index + 1} up`}
                  disabled={index === 0} onClick={() => move(index, -1)}><Icon name="up" /></button>
                <button type="button" className="icon-button" title="Move down" aria-label={`Move pin ${index + 1} down`}
                  disabled={index === pins.length - 1} onClick={() => move(index, 1)}><Icon name="down" /></button>
                <button type="button" className="icon-button" title={pins.length <= min ? `A board needs at least ${min} pins` : "Remove pin"}
                  aria-label={`Remove pin ${index + 1}`} disabled={pins.length <= min} onClick={() => remove(index)}><Icon name="close" /></button>
              </div>
              <div className="field pin-description">
                <label htmlFor={description.attrs.id} className="visually-hidden">Pin {index + 1} description</label>
                <textarea {...description.attrs} aria-required="true" rows={1} maxLength={description.guide?.maxLength}
                  placeholder="What the pin does, and how to connect it" value={pin.description}
                  onChange={(event) => update(index, { description: event.target.value })} />
                {description.problems}
              </div>
              {pullUp.problems}
            </li>
          );
        })}
      </ol>
      <div {...list.attrs} tabIndex={-1} className="pin-list-footer">
        {list.problems}
        <button type="button" className="button button-secondary" disabled={pins.length >= max}
          aria-describedby="pin-limit" onClick={() => {
            const key = Math.max(-1, ...pins.map((pin) => pin.key)) + 1;
            change([...pins, { key, name: "", description: "", type: "I/O" }]);
            focus(`pins[${pins.length}].name`);
          }}><Icon name="plus" /> Add pin</button>
        <span className="field-hint" id="pin-limit">{pins.length >= max ? `The template takes up to ${max} pins.` : `${pins.length} of up to ${max} pins`}</span>
      </div>
    </div>
  );
}

function numberValue(input: HTMLInputElement) {
  return Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : undefined;
}

function BoardFields({ context, draft, change }: { context: Context; draft: Draft; change: ChangeDraft }) {
  const { board, pins } = draft;
  const padCount = board.edges === "two" ? Math.ceil(pins.length / 2) : pins.length;
  const minEdge = padCount * padPitch;
  const clearance = board.height === undefined ? undefined : board.height - minEdge;
  const short = clearance !== undefined && clearance < 0;
  const close = clearance !== undefined && !short && clearance < 0.5;
  return (
    <>
      <div className="field-grid">
        {(["width", "height", "thickness"] as const).map((key) => (
          <Input key={key} context={context} field={`board.${key}`} type="number" step="any" mono
            value={board[key] ?? ""} onChange={(event) => change({ board: { ...board, [key]: numberValue(event.target) } })} />
        ))}
        <Select context={context} field="board.edges" value={board.edges} onChange={(edges) => change({ board: { ...board, edges: edges as Draft["board"]["edges"] } })}>
          <option value="one">One edge</option><option value="two">Two edges</option>
        </Select>
      </div>
      <div className={`live-note ${short || close ? "attention" : ""}`} aria-live="polite">
        <strong>{short ? "Edge too short" : close ? "Close to the minimum" : clearance === undefined ? "Pad spacing" : "Pads fit"}</strong>
        <p>{padCount} {board.edges === "two" ? "pads on the longer row" : "pads"} on a {padPitch} mm pitch need an edge of at least {minEdge.toFixed(2)} mm.
          {board.height !== undefined && ` The board is ${board.height.toFixed(1)} mm tall.`}</p>
      </div>
    </>
  );
}

function BusFields({ context, draft, change }: { context: Context; draft: Draft; change: ChangeDraft }) {
  const { i2c } = draft;
  // The template's rise-time refusal names both values: show it once, under both, rather than twice.
  const riseProblem = context.diagnostics.find(({ code, field }) => code === "template/render" && field === "i2c.pullUpOhms");
  const quiet = { ...context, diagnostics: context.diagnostics.filter((item) => item !== riseProblem) };
  const riseAttrs = riseProblem ? { "aria-invalid": true, "aria-describedby": "i2c-rise-problem" } as const : {};
  const { riseNs, maxRiseNs } = i2cPullUp({ ...i2c, notes: [] });
  const ratio = riseNs / maxRiseNs;
  const pass = ratio <= 1;
  const validNumbers = (i2c.pullUpOhms === undefined || i2c.pullUpOhms >= 100) && (i2c.busCapacitancePf === undefined || i2c.busCapacitancePf > 0);
  const time = Number.isFinite(riseNs) && validNumbers ? (riseNs >= 10000 ? riseNs.toPrecision(3) : riseNs.toFixed(1)) : undefined;
  return (
    <>
      <Select context={context} field="i2c.mode" value={i2c.mode} onChange={(mode) => change({ i2c: { ...i2c, mode: mode as Draft["i2c"]["mode"] } })}>
        {busModes.map((mode) => <option key={mode}>{mode}</option>)}
      </Select>
      <div className="field-grid">
        <Input context={quiet} {...riseAttrs} field="i2c.pullUpOhms" type="number" mono placeholder={i2c.mode === "Fast-mode Plus" ? "1000" : "2200"}
          value={i2c.pullUpOhms ?? ""} onChange={(event) => change({ i2c: { ...i2c, pullUpOhms: numberValue(event.target) } })} />
        <Input context={quiet} {...riseAttrs} field="i2c.busCapacitancePf" type="number" mono placeholder="100"
          value={i2c.busCapacitancePf ?? ""} onChange={(event) => change({ i2c: { ...i2c, busCapacitancePf: numberValue(event.target) } })} />
      </div>
      {riseProblem && <ul className="field-problems" id="i2c-rise-problem"><li>{plain(riseProblem.message)}</li></ul>}
      <div className={`rise-note ${time && !pass ? "attention" : ""}`} aria-live="polite">
        <div className="rise-header">
          <span>Rise time on SCL and SDA</span>
          {time && <strong className="rise-result">{pass ? "Within the limit" : `${(riseNs - maxRiseNs).toFixed(0)} ns over`}</strong>}
        </div>
        <div className="rise-reading">{time ? `${time} ns` : "Enter a resistance and a capacitance"}</div>
        <div className="meter" aria-hidden="true">
          <div className="meter-track"><div className="meter-fill" style={{ width: `${time ? Math.min(ratio / 2, 1) * 100 : 0}%` }} /></div>
          <span className="meter-limit" />
          <div className="meter-ends"><span>0</span><span>{maxRiseNs * 2} ns</span></div>
          <span className="meter-limit-label">{i2c.mode} limit, {maxRiseNs} ns</span>
        </div>
        <p className="rise-formula"><span className="mono">t<sub>r</sub> ≈ 0.8473 × R × C</span>, as the I²C specification estimates it. The datasheet and the schematic use the same numbers.</p>
      </div>
    </>
  );
}

function ExportFields({ context, draft, change, format, setFormat, advancedOpen, setAdvancedOpen, canExport, download, exporting, downloadMessage }: {
  context: Context; draft: Draft; change: ChangeDraft; format: Paper; setFormat: (format: Paper) => void;
  advancedOpen: boolean; setAdvancedOpen: (open: boolean) => void; canExport: boolean;
  download: (kind: ExportKind) => void; exporting: ExportKind | null; downloadMessage: string;
}) {
  const advanced = fieldState(context, "advanced");
  const file = (draft.part.toLowerCase().replace(/[^a-z0-9-]/g, "") || "my-part") + ".values.json";
  return (
    <>
      <div className="export-format"><span>Paper size</span><PaperSize format={format} onChange={setFormat} /></div>
      <div className="download-buttons">
        <button type="button" id="tour-download" className="button button-primary" aria-disabled={!canExport || !!exporting}
          onClick={() => { if (canExport && !exporting) download("pdf"); }}>
          <Icon name="download" /> {exporting === "pdf" ? "Preparing the PDF…" : `Download PDF (${paperLabels[format]})`}
        </button>
        <button type="button" className="button button-secondary" disabled={!canExport || !!exporting} onClick={() => download("values")}>
          <Icon name="file" /> {exporting === "values" ? "Preparing the values file…" : "Download values file"}
        </button>
      </div>
      <p className="field-hint">The values file is this datasheet as data. Save it in the repository's <code>designs/</code> folder to check and render it from the command line:</p>
      <pre className="cli"><code>{`npx hyper-elements check designs/${file}\nnpm run build -- designs/${file}`}</code></pre>
      <details open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)} className="advanced">
        <summary>Edit everything else as JSON<Icon name="chevron" /></summary>
        <div className="advanced-body">
          <label htmlFor="advanced">Additional template values</label>
          <p className="field-hint" id="advanced-hint">Features, ratings, characteristics, test curves, ordering, revision history and application notes.</p>
          <textarea {...advanced.attrs} aria-describedby={["advanced-hint", advanced.attrs["aria-describedby"]].filter(Boolean).join(" ")}
            rows={14} spellCheck={false} autoCapitalize="off" className="mono" value={draft.advanced}
            onChange={(event) => change({ advanced: event.target.value })} />
          {advanced.problems}
        </div>
      </details>
      {downloadMessage && <p className="download-message" role="status">{downloadMessage}</p>}
    </>
  );
}

type ChangeDraft = (patch: Partial<Draft>) => void;
type EditorProps = {
  draft: Draft; change: ChangeDraft; example: Example; choose: (example: Example) => void; reset: () => void;
  step: Step; focus: (id: string) => void; context: Context;
} & Omit<Parameters<typeof ExportFields>[0], "context" | "draft" | "change">;

export function StepFields({ step, context, draft, change, example, choose, reset, focus, ...exportProps }: EditorProps) {
  switch (step) {
    case "Start": return <StartFields example={example} choose={choose} reset={reset} />;
    case "Part": return <PartFields context={context} draft={draft} change={change} />;
    case "Pins": return <PinFields context={context} pins={draft.pins} change={(pins) => change({ pins })} focus={focus} />;
    case "Board": return <BoardFields context={context} draft={draft} change={change} />;
    case "I²C bus": return <BusFields context={context} draft={draft} change={change} />;
    case "Export": return <ExportFields context={context} draft={draft} change={change} {...exportProps} />;
  }
}

export function stepGuidance(step: Step, guides: FieldGuides): string {
  switch (step) {
    case "Start": return "Pick a part to start from. You can change everything about it in the next steps.";
    case "Part": return guides.summary.guidance ?? "Fill in the details shown on the first page.";
    case "Pins": return "List the pads in order. The board drawing, the pin table and the schematic all redraw from this list.";
    case "Board": return guides.board.guidance ?? "Set the dimensions and the edges that carry the pads.";
    case "I²C bus": return guides["i2c.mode"].guidance ?? "Set the mode and calculate the rise time for the bus.";
    case "Export": return "Download the PDF, or the values file to keep the datasheet with your code.";
  }
}
