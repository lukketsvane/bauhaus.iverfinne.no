import { Rng } from "./rng";
import { getPalette } from "./palettes";
import type { GenParams, Scene, StyleId, StyleMeta } from "./types";
import { petals } from "./modules/petals";
import { semicircles } from "./modules/semicircles";
import { blocks } from "./modules/blocks";
import { mondrian } from "./modules/mondrian";
import { isocubes } from "./modules/isocubes";
import { quarters } from "./modules/quarters";
import { arches } from "./modules/arches";
import { medley } from "./modules/medley";
import { tiles } from "./modules/tiles";

const MODULES = { petals, semicircles, blocks, mondrian, isocubes, quarters, arches, medley, tiles } as const;

export const STYLES: StyleMeta[] = [
  { id: "petals", name: "Petals", cols: [3, 6], rows: [4, 8] },
  { id: "quarters", name: "Quarters", cols: [3, 5], rows: [4, 7] },
  { id: "semicircles", name: "Semicircles", cols: [3, 6], rows: [4, 7] },
  { id: "arches", name: "Arches", cols: [3, 5], rows: [4, 7] },
  { id: "blocks", name: "Blocks", cols: [3, 5], rows: [3, 6] },
  { id: "isocubes", name: "Isocubes", cols: [3, 6], rows: [4, 8] },
  { id: "medley", name: "Medley", cols: [4, 6], rows: [5, 8] },
  { id: "tiles", name: "Tiles", cols: [4, 7], rows: [5, 9] },
  { id: "mondrian", name: "Mondrian", cols: [4, 6], rows: [5, 7] },
];

export const STYLE_IDS = STYLES.map((s) => s.id) as StyleId[];

export function generate(params: GenParams): Scene {
  const rng = new Rng(params.seed);
  const palette = getPalette(params.paletteId);
  const fn = MODULES[params.style];
  return fn({
    rng,
    palette,
    cols: params.cols,
    rows: params.rows,
    density: params.density,
  });
}
