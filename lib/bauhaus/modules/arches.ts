import { CELL, type ModuleFn, type Prim } from "../types";
import { arcPath, EDGES } from "../geom";

// Concentric rainbow arcs: each cell stacks a few half-arcs of decreasing
// radius in different colours, anchored to one edge. (Reference: arch motifs.)

export const arches: ModuleFn = ({ rng, palette, cols, rows, density }) => {
  const prims: Prim[] = [];
  const fillP = 0.7 + density * 0.28;
  const sw = CELL * 0.13;

  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      if (!rng.chance(fillP)) continue;
      const x = c * CELL;
      const y = row * CELL;
      const edge = rng.pick(EDGES);
      const bands = rng.int(2, 3);
      const start = rng.int(0, palette.colors.length - 1);
      for (let b = 0; b < bands; b++) {
        const r = (CELL / 2) * (1 - b / (bands + 0.4));
        prims.push({
          kind: "path",
          d: arcPath(x, y, CELL, edge, r),
          fill: "none",
          stroke: palette.colors[(start + b) % palette.colors.length],
          sw,
        });
      }
    }
  }

  return { width: cols * CELL, height: rows * CELL, prims };
};
