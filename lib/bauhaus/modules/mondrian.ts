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

  // fill colours must be visible against the field (exclude any bg-coloured swatch)
  const fillColors = palette.colors.filter((c) => c.toLowerCase() !== palette.bg.toLowerCase());
  const colors = fillColors.length ? fillColors : [palette.ink];

  // Surviving interior lines (drop some whole lines to merge bands → varied
  // rectangle sizes while staying a clean connected grid).
  const keep = 0.62 + density * 0.28;
  const xs = [0];
  for (let i = 1; i < cols; i++) if (rng.chance(keep)) xs.push(i * CELL);
  xs.push(W);
  const ys = [0];
  for (let i = 1; i < rows; i++) if (rng.chance(keep)) ys.push(i * CELL);
  ys.push(H);

  // Flood some cells with colour (guarantee a minimum so it's never near-empty).
  const colorP = 0.24 + density * 0.2;
  const allCells: Array<{ x: number; y: number; w: number; h: number }> = [];
  for (let r = 0; r < ys.length - 1; r++)
    for (let c = 0; c < xs.length - 1; c++)
      allCells.push({ x: xs[c], y: ys[r], w: xs[c + 1] - xs[c], h: ys[r + 1] - ys[r] });

  let filled = 0;
  const minColored = Math.min(3, allCells.length);
  for (const cell of allCells) {
    if (rng.chance(colorP)) {
      prims.push({ kind: "rect", ...cell, fill: rng.pick(colors) });
      filled++;
    }
  }
  for (const cell of rng.shuffle(allCells)) {
    if (filled >= minColored) break;
    prims.push({ kind: "rect", ...cell, fill: rng.pick(colors) });
    filled++;
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
