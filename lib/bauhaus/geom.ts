// Shared geometry helpers (SVG path / polygon builders) used by the richer
// generative modules. Coordinates are in CELL units.

export type Corner = "tl" | "tr" | "br" | "bl";
export type Edge = "n" | "s" | "w" | "e";
export const CORNERS: Corner[] = ["tl", "tr", "br", "bl"];
export const EDGES: Edge[] = ["n", "s", "w", "e"];

/** Quarter disc anchored at a cell corner, filling toward the cell centre. */
export function quarterPath(x: number, y: number, s: number, c: Corner): string {
  switch (c) {
    case "tl": return `M${x},${y} L${x + s},${y} A${s},${s} 0 0 1 ${x},${y + s} Z`;
    case "tr": return `M${x + s},${y} L${x},${y} A${s},${s} 0 0 0 ${x + s},${y + s} Z`;
    case "br": return `M${x + s},${y + s} L${x},${y + s} A${s},${s} 0 0 1 ${x + s},${y} Z`;
    case "bl": return `M${x},${y + s} L${x},${y} A${s},${s} 0 0 1 ${x + s},${y + s} Z`;
  }
}

/** Half disc with its flat side on a cell edge, bulging inward (r = s/2). */
export function halfPath(x: number, y: number, s: number, e: Edge): string {
  const r = s / 2;
  switch (e) {
    case "n": return `M${x},${y} A${r},${r} 0 0 1 ${x + s},${y} Z`;
    case "s": return `M${x},${y + s} A${r},${r} 0 0 0 ${x + s},${y + s} Z`;
    case "w": return `M${x},${y} A${r},${r} 0 0 0 ${x},${y + s} Z`;
    case "e": return `M${x + s},${y} A${r},${r} 0 0 1 ${x + s},${y + s} Z`;
  }
}

/** One 90° quadrant of a circle centred at (cx,cy). q: 0=TL 1=TR 2=BR 3=BL. */
export function quadrantPath(cx: number, cy: number, r: number, q: 0 | 1 | 2 | 3): string {
  switch (q) {
    case 0: return `M${cx},${cy} L${cx - r},${cy} A${r},${r} 0 0 1 ${cx},${cy - r} Z`;
    case 1: return `M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 0 1 ${cx + r},${cy} Z`;
    case 2: return `M${cx},${cy} L${cx + r},${cy} A${r},${r} 0 0 1 ${cx},${cy + r} Z`;
    case 3: return `M${cx},${cy} L${cx},${cy + r} A${r},${r} 0 0 1 ${cx - r},${cy} Z`;
  }
}

/** Diamond (square rotated 45°) inscribed in the cell. */
export function diamondPts(x: number, y: number, s: number): Array<[number, number]> {
  return [
    [x + s / 2, y],
    [x + s, y + s / 2],
    [x + s / 2, y + s],
    [x, y + s / 2],
  ];
}

/** Right triangle filling half the cell; `c` marks the right-angle corner. */
export function triPts(x: number, y: number, s: number, c: Corner): Array<[number, number]> {
  switch (c) {
    case "tl": return [[x, y], [x + s, y], [x, y + s]];
    case "tr": return [[x + s, y], [x + s, y + s], [x, y]];
    case "br": return [[x + s, y + s], [x, y + s], [x + s, y]];
    case "bl": return [[x, y + s], [x, y], [x + s, y + s]];
  }
}

/** Semicircular arc stroke path on a cell edge at a given radius (centre on edge midpoint). */
export function arcPath(x: number, y: number, s: number, e: Edge, r: number): string {
  const mx = x + s / 2, my = y + s / 2;
  switch (e) {
    case "n": return `M${mx - r},${y} A${r},${r} 0 0 1 ${mx + r},${y}`;
    case "s": return `M${mx - r},${y + s} A${r},${r} 0 0 0 ${mx + r},${y + s}`;
    case "w": return `M${x},${my - r} A${r},${r} 0 0 0 ${x},${my + r}`;
    case "e": return `M${x + s},${my - r} A${r},${r} 0 0 1 ${x + s},${my + r}`;
  }
}
