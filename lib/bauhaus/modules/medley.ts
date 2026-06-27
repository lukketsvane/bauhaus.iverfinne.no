import { CELL, type ModuleFn, type Prim } from "../types";
import { quarterPath, halfPath, quadrantPath, diamondPts, triPts, arcPath, CORNERS, EDGES } from "../geom";

// A rich mixed-motif grid: every cell draws a different primitive pulled from
// a broad vocabulary — quarter, half, circle, triangle, diamond, rings, dots,
// lens, arcs, quartered circle. The "kitchen sink" generator.
// (Reference: dense multi-motif Bauhaus pattern.)

type Ctx = { rng: import("../rng").Rng; palette: import("../types").Palette };

const MOTIFS = [
  "quarter", "half", "circle", "triangle", "diamond",
  "rings", "dots", "lens", "arcs", "quartered", "square",
] as const;

function motif(name: (typeof MOTIFS)[number], x: number, y: number, { rng, palette }: Ctx): Prim[] {
  const col = () => rng.pick(palette.colors);
  const s = CELL, r = CELL / 2, cx = x + r, cy = y + r;
  switch (name) {
    case "quarter":
      return [{ kind: "path", d: quarterPath(x, y, s, rng.pick(CORNERS)), fill: col() }];
    case "half":
      return [{ kind: "path", d: halfPath(x, y, s, rng.pick(EDGES)), fill: col() }];
    case "circle":
      return [{ kind: "circle", cx, cy, r, fill: col() }];
    case "triangle":
      return [{ kind: "poly", pts: triPts(x, y, s, rng.pick(CORNERS)), fill: col() }];
    case "diamond":
      return [{ kind: "poly", pts: diamondPts(x, y, s), fill: col() }];
    case "square":
      return [{ kind: "rect", x: x + s * 0.12, y: y + s * 0.12, w: s * 0.76, h: s * 0.76, fill: col() }];
    case "lens": {
      const a = rng.pick(CORNERS);
      const opp = { tl: "br", br: "tl", tr: "bl", bl: "tr" } as const;
      const c1 = col();
      return [
        { kind: "path", d: quarterPath(x, y, s, a), fill: c1 },
        { kind: "path", d: quarterPath(x, y, s, opp[a]), fill: col() },
      ];
    }
    case "quartered": {
      const out: Prim[] = [];
      for (let q = 0 as 0 | 1 | 2 | 3; q < 4; q = (q + 1) as 0 | 1 | 2 | 3) {
        if (rng.chance(0.78)) out.push({ kind: "path", d: quadrantPath(cx, cy, r, q), fill: col() });
      }
      return out;
    }
    case "rings": {
      const out: Prim[] = [];
      const n = rng.int(2, 3);
      const base = col();
      for (let i = 0; i < n; i++) {
        out.push({ kind: "circle", cx, cy, r: r * (1 - i / n), fill: i % 2 === 0 ? base : palette.bg });
      }
      return out;
    }
    case "dots": {
      const out: Prim[] = [];
      const n = rng.pick([2, 3]);
      const dr = (s / n) * 0.32;
      const c = col();
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          out.push({ kind: "circle", cx: x + (i + 0.5) * (s / n), cy: y + (j + 0.5) * (s / n), r: dr, fill: c });
      return out;
    }
    case "arcs": {
      // filled concentric half-disc bands (top/bottom only → no edge slivers)
      const out: Prim[] = [];
      const e: "n" | "s" = rng.chance(0.5) ? "n" : "s";
      const bands = rng.int(3, 4);
      const start = rng.int(0, palette.colors.length - 1);
      for (let b = 0; b < bands; b++) {
        out.push({
          kind: "path",
          d: `${arcPath(x, y, s, e, r * ((bands - b) / bands))} Z`,
          fill: palette.colors[(start + b) % palette.colors.length],
        });
      }
      return out;
    }
  }
}

export const medley: ModuleFn = ({ rng, palette, cols, rows, density }) => {
  const prims: Prim[] = [];
  const fillP = 0.82 + density * 0.16;
  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      if (!rng.chance(fillP)) continue;
      prims.push(...motif(rng.pick(MOTIFS), c * CELL, row * CELL, { rng, palette }));
    }
  }
  return { width: cols * CELL, height: rows * CELL, prims };
};
