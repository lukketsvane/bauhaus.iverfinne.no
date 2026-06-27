import { CELL, type ModuleFn, type Prim } from "../types";

// Half-circles (flat side on a cell edge) plus full circles, in a calm rhythm.
// Mostly ink with sparse accent colour. (Reference poster: bauhaus 1919, sage.)

type Edge = "n" | "s" | "w" | "e";
const EDGES: Edge[] = ["n", "s", "w", "e"];

function half(x: number, y: number, s: number, edge: Edge): string {
  const r = s / 2;
  switch (edge) {
    case "n": // flat on top edge, bulging down
      return `M${x},${y} A${r},${r} 0 0 1 ${x + s},${y} Z`;
    case "s": // flat on bottom edge, bulging up
      return `M${x},${y + s} A${r},${r} 0 0 0 ${x + s},${y + s} Z`;
    case "w": // flat on left edge, bulging right
      return `M${x},${y} A${r},${r} 0 0 0 ${x},${y + s} Z`;
    case "e": // flat on right edge, bulging left
      return `M${x + s},${y} A${r},${r} 0 0 1 ${x + s},${y + s} Z`;
  }
}

export const semicircles: ModuleFn = ({ rng, palette, cols, rows, density }) => {
  const prims: Prim[] = [];
  const ink = palette.colors[0];
  const accent = palette.colors[1] ?? palette.colors[0];
  const fillP = 0.84 + density * 0.14;
  const accentP = 0.14 + density * 0.12;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!rng.chance(fillP)) continue;
      const x = c * CELL;
      const y = r * CELL;
      const color = rng.chance(accentP) ? accent : ink;

      if (rng.chance(0.32)) {
        prims.push({ kind: "circle", cx: x + CELL / 2, cy: y + CELL / 2, r: CELL / 2, fill: color });
      } else {
        prims.push({ kind: "path", d: half(x, y, CELL, rng.pick(EDGES)), fill: color });
      }
    }
  }

  return { width: cols * CELL, height: rows * CELL, prims };
};
