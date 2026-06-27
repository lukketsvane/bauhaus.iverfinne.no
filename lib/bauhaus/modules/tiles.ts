import { CELL, type ModuleFn, type Prim } from "../types";
import { triPts, CORNERS } from "../geom";

// Binary / diagonal tile grid: square cells filled, left empty, or split on a
// diagonal into two triangles. Reads as a crisp orthogonal maze-like pattern.
// (Reference: black-and-white Bauhaus grid poster.)

export const tiles: ModuleFn = ({ rng, palette, cols, rows, density }) => {
  const prims: Prim[] = [];
  const fg = palette.colors[0];
  const fillP = 0.46 + density * 0.34;

  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      const x = c * CELL;
      const y = row * CELL;
      const roll = rng.float();
      if (roll < 0.22) {
        // diagonal split → two triangles (one coloured)
        const corner = rng.pick(CORNERS);
        prims.push({ kind: "poly", pts: triPts(x, y, CELL, corner), fill: rng.pick(palette.colors) });
      } else if (rng.chance(fillP)) {
        const color = palette.colors.length > 2 && rng.chance(0.3) ? rng.pick(palette.colors) : fg;
        prims.push({ kind: "rect", x, y, w: CELL, h: CELL, fill: color });
      }
    }
  }

  return { width: cols * CELL, height: rows * CELL, prims };
};
