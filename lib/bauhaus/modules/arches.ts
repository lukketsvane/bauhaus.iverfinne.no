import { CELL, type ModuleFn, type Prim } from "../types";

// Concentric colour bands per cell: either an upright/hanging RAINBOW
// (nested half-discs on the top or bottom edge) or a TARGET (nested full
// circles). Both sit fully inside the cell — no clipped slivers.
// (Reference: arch / concentric motifs.)

function halfDisc(x: number, y: number, s: number, edge: "n" | "s", r: number): string {
  const mx = x + s / 2;
  return edge === "n"
    ? `M${mx - r},${y} A${r},${r} 0 0 1 ${mx + r},${y} Z` // flat on top, bulge down
    : `M${mx - r},${y + s} A${r},${r} 0 0 0 ${mx + r},${y + s} Z`; // flat on bottom, bulge up
}

export const arches: ModuleFn = ({ rng, palette, cols, rows, density }) => {
  const prims: Prim[] = [];
  const fillP = 0.9 + density * 0.08;
  const R = CELL / 2;

  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      if (!rng.chance(fillP)) continue;
      const x = c * CELL;
      const y = row * CELL;
      const bands = rng.int(3, 4);
      const start = rng.int(0, palette.colors.length - 1);
      const target = rng.chance(0.42);
      const edge: "n" | "s" = rng.chance(0.5) ? "n" : "s";

      for (let b = 0; b < bands; b++) {
        const r = R * ((bands - b) / bands);
        const fill = palette.colors[(start + b) % palette.colors.length];
        if (target) {
          prims.push({ kind: "circle", cx: x + R, cy: y + R, r, fill });
        } else {
          prims.push({ kind: "path", d: halfDisc(x, y, CELL, edge, r), fill });
        }
      }
    }
  }

  return { width: cols * CELL, height: rows * CELL, prims };
};
