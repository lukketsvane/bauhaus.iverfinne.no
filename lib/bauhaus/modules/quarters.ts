import { CELL, type ModuleFn, type Prim } from "../types";
import { quadrantPath } from "../geom";

// Grid of circles, each split into four colour quadrants (some left empty),
// with occasional whole/half discs. Kandinsky-ish colour wheels.
// (Reference: multi-colour quartered-circle poster.)

export const quarters: ModuleFn = ({ rng, palette, cols, rows, density }) => {
  const prims: Prim[] = [];
  const r = CELL / 2;
  const fillP = 0.78 + density * 0.2;
  const emptyQuad = 0.82 - density * 0.25; // chance a quadrant is coloured

  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      if (!rng.chance(fillP)) continue;
      const cx = c * CELL + r;
      const cy = row * CELL + r;
      for (let q = 0 as 0 | 1 | 2 | 3; q < 4; q = (q + 1) as 0 | 1 | 2 | 3) {
        if (!rng.chance(emptyQuad)) continue;
        prims.push({ kind: "path", d: quadrantPath(cx, cy, r, q), fill: rng.pick(palette.colors) });
      }
    }
  }

  return { width: cols * CELL, height: rows * CELL, prims };
};
