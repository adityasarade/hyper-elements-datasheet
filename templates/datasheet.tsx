/**
 * Wren's datasheet as a template: one set of values for a sensor board (its pins, ratings, characteristics, curves,
 * board size, ordering lines and revisions) renders the whole four-page datasheet, on A4 and on Letter.
 *
 * Locked: the layout, the type, the colours, the section order, the I²C timing for each bus mode, and every drawing.
 * The board, its pin callouts, the schematic and the dimension drawing are drawn from the pins and the board's size,
 * so they always agree with the pin table. Open: the part's data, every value with a limit that keeps it on its page.
 */
import { prop } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import WrenDatasheet, { DEFAULT_CHARACTERISTICS_NOTE, WR2, i2cPullUp, prepareCurve, type Datasheet } from "../src/wren-wr2-datasheet.tsx";

const PIN_TYPES = ["Power", "Ground", "I/O", "Input", "Output"] as const;
const PITCH = 2.54;

/** A line of a limits table: min, typ and max are text, so "±0.2", "−0.3" and "V_DD + 0.3" all fit. */
const limit = (label: string) => prop.text({ label, maxLength: 8 });
const symbol = prop.text({ label: "Symbol", maxLength: 10, pattern: "^[A-Za-zΔ]{1,4}(_[A-Za-z0-9;]{1,7})?$", guidance: "A subscript follows an underscore: V_IN, t_SU;DAT." });

export default template({
  id: "wren.Datasheet",
  version: "1.0.0",
  label: "Wren sensor datasheet",
  guidance:
    "One datasheet per board and revision. Write values the way the test report has them, with a real minus sign (−) and units in their own column. Every drawing is made from the pins and the board's size: change those, never the drawings. Four pages for a part like WR-2; longer lists flow onto a fifth, and a table that doesn't fit breaks between rows with its header repeated.",
  root: "Document",
  formats: { a4: { size: "A4" }, letter: { size: "Letter" } },
  fields: {
    part: prop.text({ label: "Part number", required: true, maxLength: 8, pattern: "^[A-Z]{1,4}-[0-9]{1,3}[A-Z]?$", guidance: "As it's printed on the board: WR-2, WR-4." }),
    name: prop.text({ label: "Name", required: true, maxLength: 26, guidance: "What it is, in two or three words: Environmental sensor." }),
    revision: prop.text({ label: "Revision", required: true, pattern: "^[A-Z]$", guidance: "One capital letter. Match the latest dated entry in the revision history." }),
    date: prop.date({ label: "Date", required: true, guidance: "The revision's release date. The datasheet shows its month." }),
    summary: prop.text({ label: "Summary", required: true, maxLength: 96, guidance: "One sentence under the name: what it measures, how big it is, how it talks." }),
    highlights: prop.list(
      prop.object(
        {
          value: prop.text({ label: "Value", required: true, maxLength: 10 }),
          label: prop.text({ label: "Label", required: true, maxLength: 28 }),
        },
        { label: "Highlight" },
      ),
      { label: "Highlights", required: true, min: 2, max: 4, guidance: "The figures a buyer compares first, each with what it's of: ±0.2 °C, Temperature, 0 to 65 °C." },
    ),
    features: prop.list(prop.text({ label: "Feature", maxLength: 70 }), { label: "Features", required: true, min: 3, max: 6 }),
    applications: prop.list(prop.text({ label: "Application", maxLength: 36 }), { label: "Applications", required: true, min: 2, max: 5 }),
    description: prop.text({ label: "Description", required: true, maxLength: 300, guidance: "Two or three sentences: what it measures, what it runs from, what makes it different." }),
    board: prop.object(
      {
        width: prop.number({ label: "Width, mm", required: true, min: 10, max: 40 }),
        height: prop.number({ label: "Height, mm", required: true, min: 8, max: 34 }),
        thickness: prop.number({ label: "Thickness, mm", required: true, min: 0.4, max: 3.2 }),
        parts: prop.number({ label: "Tallest part above the board, mm", required: true, min: 0, max: 4 }),
        hole: prop.number({ label: "Mounting hole diameter, mm", required: true, min: 0, max: 3.5, guidance: "0 for no holes." }),
        edges: prop.choice(["one", "two"], { label: "Pads along", required: true, guidance: "one: every pad down the left edge. two: the first half down the left, the rest back up the right." }),
      },
      { label: "Board", required: true, guidance: "The pads are on a 2.54 mm pitch: the edge they're on must be at least 2.54 mm per pad long." },
    ),
    pins: prop.list(
      prop.object(
        {
          name: prop.text({ label: "Name", required: true, pattern: "^[A-Z0-9][A-Z0-9_+/-]{0,5}$", guidance: "As on the silkscreen, up to six capitals: VIN, SDA, INT1." }),
          type: prop.choice(PIN_TYPES, { label: "Type", required: true, guidance: "Power pins join the supply in the schematic, ground pins go to ground, and the rest wire to the host." }),
          description: prop.text({ label: "Description", required: true, maxLength: 72 }),
          pullUp: prop.boolean({ label: "Needs a pull-up", guidance: "The schematic draws a resistor to 3.3 V using the I²C pull-up resistance." }),
        },
        { label: "Pin" },
      ),
      { label: "Pins", required: true, min: 2, max: 12, guidance: "In order, pin 1 first. The board drawing, the pin table and the schematic are all drawn from this list. Where the pads are too close for their callouts, the callouts fan out." },
    ),
    ratings: prop.list(
      prop.object(
        { parameter: prop.text({ label: "Parameter", required: true, maxLength: 44 }), symbol, min: limit("Min"), max: limit("Max"), unit: prop.text({ label: "Unit", required: true, maxLength: 5 }) },
        { label: "Rating" },
      ),
      { label: "Absolute maximum ratings", required: true, min: 1, max: 6 },
    ),
    characteristics: prop.list(
      prop.object(
        {
          group: prop.text({ label: "Group", maxLength: 14, guidance: "Rows of the same group in a row share its name: Temperature, Supply." }),
          parameter: prop.text({ label: "Parameter", required: true, maxLength: 28 }),
          symbol,
          conditions: prop.text({ label: "Conditions", maxLength: 26 }),
          min: limit("Min"),
          typ: limit("Typ"),
          max: limit("Max"),
          unit: prop.text({ label: "Unit", maxLength: 5 }),
        },
        { label: "Characteristic" },
      ),
      { label: "Electrical characteristics", required: true, min: 1, max: 14 },
    ),
    characteristicsNote: prop.text({ label: "Electrical characteristics table note", default: DEFAULT_CHARACTERISTICS_NOTE, maxLength: 100 }),
    curves: prop.list(
      prop.object(
        {
          title: prop.text({ label: "Title", required: true, maxLength: 34 }),
          x: prop.text({ label: "x axis", required: true, maxLength: 28, guidance: "What and its unit: Temperature, °C." }),
          y: prop.text({ label: "y axis", required: true, maxLength: 18, guidance: "What and its unit: Error, °C." }),
          points: prop.list(
            prop.object(
              {
                x: prop.number({ label: "x", required: true }),
                typ: prop.number({ label: "Typical error", required: true }),
                limit: prop.number({ label: "Limit, ±", required: true, min: 0 }),
              },
              { label: "Point" },
            ),
            { label: "Points", required: true, min: 3, max: 16, guidance: "Measured points with unique x-values, in any order. Give at least one nonzero typical error or limit." },
          ),
        },
        { label: "Curve" },
      ),
      { label: "Typical performance", required: true, min: 1, max: 2 },
    ),
    i2c: prop.object(
      {
        mode: prop.choice(["Standard", "Fast", "Fast-mode Plus"], { label: "Fastest I²C mode", required: true, guidance: "Sets the timing table: the I²C specification's limits for that mode." }),
        pullUpOhms: prop.number({ label: "Pull-up resistance, Ω", integer: true, min: 100, max: 99999, guidance: "Used in the schematic and rise-time calculation. Defaults to 1 kΩ for Fast-mode Plus and 2.2 kΩ otherwise." }),
        busCapacitancePf: prop.number({ label: "Bus capacitance per line, pF", integer: true, min: 1, max: 550, default: 100, guidance: "Maximum total capacitive load per SDA or SCL line for this example." }),
        notes: prop.list(prop.text({ label: "Note", maxLength: 170 }), { label: "Notes", required: true, min: 1, max: 3, guidance: "The address and any other interface details. Pull-up sizing is calculated separately." }),
      },
      { label: "I²C interface", required: true },
    ),
    application: prop.list(prop.text({ label: "Note", maxLength: 110 }), { label: "Application notes", required: true, min: 1, max: 3 }),
    ordering: prop.list(
      prop.object(
        {
          part: prop.text({ label: "Part number", required: true, maxLength: 14, pattern: "^[A-Z0-9-]+$" }),
          description: prop.text({ label: "Description", required: true, maxLength: 64 }),
          pack: prop.text({ label: "Pack", required: true, maxLength: 16 }),
        },
        { label: "Ordering line" },
      ),
      { label: "Ordering", required: true, min: 1, max: 5 },
    ),
    revisions: prop.list(
      prop.object(
        {
          rev: prop.text({ label: "Revision", required: true, pattern: "^[A-Z]$" }),
          date: prop.date({ label: "Date", required: true }),
          changes: prop.text({ label: "Changes", required: true, maxLength: 96 }),
        },
        { label: "Revision" },
      ),
      { label: "Revision history", required: true, min: 1, max: 5, guidance: "Newest first." },
    ),
  },
  rules: {
    require: { core: ["layout/overflow", "document/overflow"] },
    root: { lang: true, title: true },
  },
  example: WR2,
  render(values, { format }) {
    const v = values as unknown as Datasheet;
    // The pads must fit the edge they're on: refuse a board too short for them, rather than draw pads off it.
    const perEdge = v.board.edges === "two" ? Math.ceil(v.pins.length / 2) : v.pins.length;
    const needed = perEdge * PITCH;
    if (needed > v.board.height) {
      throw new Error(`${perEdge} pads on a ${PITCH} mm pitch need an edge of at least ${needed.toFixed(1)} mm; the board is ${v.board.height} mm tall. Make it taller, or put the pads along two edges.`);
    }
    const { riseNs, maxRiseNs } = i2cPullUp(v.i2c);
    if (riseNs > maxRiseNs) {
      throw new Error(`i2c.pullUpOhms and i2c.busCapacitancePf give a rise time of ${riseNs.toPrecision(3)} ns. Reduce resistance or capacitance to meet the ${maxRiseNs} ns limit for ${v.i2c.mode}.`);
    }
    for (const [i, curve] of v.curves.entries()) {
      const { error } = prepareCurve(curve.points);
      if (error !== undefined) throw new Error(`curves[${i}].points${error}`);
    }
    const latest = v.revisions.reduce((newest, entry) => entry.date > newest.date ? entry : newest);
    if (v.revision !== latest.rev) {
      throw new Error(`revision: cover revision ${v.revision} must match the newest revisions entry (${latest.rev}, ${latest.date}).`);
    }
    return WrenDatasheet({ ...v, size: format === "letter" ? "Letter" : "A4" });
  },
});
