import { CELL, type ModuleFn, type Prim } from "../types";

// Extruded squares: an outlined top face at a cell's top-left with a solid
// extrusion pushed toward the bottom-right, reading as a 3D block / shadow.
// (Reference poster: Bauhaus 1923, orange + ink.)

export const blocks: ModuleFn = ({ rng, palette, cols, rows, density }) => {
  const prims: Prim[] = [];
  const fillP = 0.8 + density * 0.2;
  const m = CELL * 0.6; // face size
  const d = CELL - m; // extrusion depth (fills to cell corner)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!rng.chance(fillP)) continue;
      const x = c * CELL;
      const y = r * CELL;
      const color = rng.pick(palette.colors);

      // front face corners
      const B: [number, number] = [x + m, y]; // top-right
      const C: [number, number] = [x + m, y + m]; // bottom-right
      const D: [number, number] = [x, y + m]; // bottom-left
      // back (shifted) corners
      const Bb: [number, number] = [x + m + d, y + d];
      const Cb: [number, number] = [x + m + d, y + m + d];
      const Db: [number, number] = [x + d, y + m + d];

      // extrusion silhouette (right + bottom faces)
      prims.push({ kind: "poly", pts: [B, Bb, Cb, Db, D, C], fill: color });
      // top face: outline only, background fill
      prims.push({
        kind: "rect",
        x,
        y,
        w: m,
        h: m,
        fill: palette.bg,
        stroke: color,
        sw: CELL * 0.05,
      });
    }
  }

  return { width: cols * CELL, height: rows * CELL, prims };
};
