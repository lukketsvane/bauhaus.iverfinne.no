import { CELL, type ModuleFn, type Prim } from "../types";

// De Stijl / Mondrian: an irregular lattice of full-span black lines over a
// bone field, with a few cells flooded in primary colour. Lines always run
// edge to edge, so the grid never breaks into floating stubs.
// (Reference poster: Bauhaus 1919 Dessau.)

export const mondrian: ModuleFn = ({ rng, palette, cols, rows, density }) => {
  const W = cols * CELL;
  const H = rows * CELL;
  const prims: Prim[] = [];
  const line = palette.ink;
  const lw = CELL * 0.11;

  prims.push({ kind: "rect", x: 0, y: 0, w: W, h: H, fill: palette.bg });

  // Surviving interior lines (drop some whole lines to merge bands → varied
  // rectangle sizes while staying a clean connected grid).
  const keep = 0.62 + density * 0.28;
  const xs = [0];
  for (let i = 1; i < cols; i++) if (rng.chance(keep)) xs.push(i * CELL);
  xs.push(W);
  const ys = [0];
  for (let i = 1; i < rows; i++) if (rng.chance(keep)) ys.push(i * CELL);
  ys.push(H);

  // Flood some cells with colour.
  const colorP = 0.16 + density * 0.18;
  for (let r = 0; r < ys.length - 1; r++) {
    for (let c = 0; c < xs.length - 1; c++) {
      if (rng.chance(colorP)) {
        prims.push({
          kind: "rect",
          x: xs[c],
          y: ys[r],
          w: xs[c + 1] - xs[c],
          h: ys[r + 1] - ys[r],
          fill: rng.pick(palette.colors),
        });
      }
    }
  }

  // Full-span grid lines on top.
  for (const x of xs.slice(1, -1)) {
    prims.push({ kind: "rect", x: x - lw / 2, y: 0, w: lw, h: H, fill: line });
  }
  for (const y of ys.slice(1, -1)) {
    prims.push({ kind: "rect", x: 0, y: y - lw / 2, w: W, h: lw, fill: line });
  }
  // outer frame
  prims.push({ kind: "rect", x: 0, y: 0, w: W, h: lw, fill: line });
  prims.push({ kind: "rect", x: 0, y: H - lw, w: W, h: lw, fill: line });
  prims.push({ kind: "rect", x: 0, y: 0, w: lw, h: H, fill: line });
  prims.push({ kind: "rect", x: W - lw, y: 0, w: lw, h: H, fill: line });

  return { width: W, height: H, prims };
};
