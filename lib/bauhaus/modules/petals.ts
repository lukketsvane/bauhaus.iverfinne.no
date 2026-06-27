import { CELL, type ModuleFn, type Prim } from "../types";

// Quarter-circle "petals". Each cell holds a quarter disc anchored at one of
// its four corners; opposite quarters in neighbouring cells read as leaves /
// eyes. Occasional full circles and empty cells break the rhythm.
// (Reference poster: Bauhaus 1923, lime + blue.)

type Corner = "tl" | "tr" | "br" | "bl";
const CORNERS: Corner[] = ["tl", "tr", "br", "bl"];

function quarter(x: number, y: number, s: number, corner: Corner): string {
  switch (corner) {
    case "tl":
      return `M${x},${y} L${x + s},${y} A${s},${s} 0 0 1 ${x},${y + s} Z`;
    case "tr":
      return `M${x + s},${y} L${x},${y} A${s},${s} 0 0 0 ${x + s},${y + s} Z`;
    case "br":
      return `M${x + s},${y + s} L${x},${y + s} A${s},${s} 0 0 1 ${x + s},${y} Z`;
    case "bl":
      return `M${x},${y + s} L${x},${y} A${s},${s} 0 0 1 ${x + s},${y + s} Z`;
  }
}

export const petals: ModuleFn = ({ rng, palette, cols, rows, density }) => {
  const prims: Prim[] = [];
  const fillP = 0.55 + density * 0.4; // chance a cell has something

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!rng.chance(fillP)) continue;
      const x = c * CELL;
      const y = r * CELL;
      const color = rng.pick(palette.colors);

      const roll = rng.float();
      if (roll < 0.12) {
        // full disc
        prims.push({ kind: "circle", cx: x + CELL / 2, cy: y + CELL / 2, r: CELL / 2, fill: color });
      } else if (roll < 0.2) {
        // two opposite quarters → leaf inside one cell
        const a = rng.pick(CORNERS);
        const opp: Record<Corner, Corner> = { tl: "br", br: "tl", tr: "bl", bl: "tr" };
        prims.push({ kind: "path", d: quarter(x, y, CELL, a), fill: color });
        prims.push({ kind: "path", d: quarter(x, y, CELL, opp[a]), fill: rng.pick(palette.colors) });
      } else {
        prims.push({ kind: "path", d: quarter(x, y, CELL, rng.pick(CORNERS)), fill: color });
      }
    }
  }

  return { width: cols * CELL, height: rows * CELL, prims };
};
