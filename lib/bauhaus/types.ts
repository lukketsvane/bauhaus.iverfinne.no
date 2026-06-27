// Shared types for the generative Bauhaus engine.
//
// The engine produces an abstract Scene of SVG primitives in a fixed unit
// space (cell = CELL units). The renderer maps that to an actual <svg>.

export const CELL = 100;

export type StyleId =
  | "petals"
  | "semicircles"
  | "blocks"
  | "mondrian"
  | "isocubes"
  | "quarters"
  | "arches"
  | "medley"
  | "tiles";

export interface StyleMeta {
  id: StyleId;
  name: string;
  /** Recommended grid range for this style. */
  cols: [number, number];
  rows: [number, number];
}

export interface Palette {
  id: string;
  name: string;
  /** Poster background. */
  bg: string;
  /** Ink colour for typography. */
  ink: string;
  /** Shape fill colours. */
  colors: string[];
}

export type Prim =
  | { kind: "rect"; x: number; y: number; w: number; h: number; fill: string; stroke?: string; sw?: number }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string; stroke?: string; sw?: number }
  | { kind: "path"; d: string; fill: string; stroke?: string; sw?: number }
  | { kind: "poly"; pts: Array<[number, number]>; fill: string; stroke?: string; sw?: number };

export interface Scene {
  /** Art width/height in CELL units. */
  width: number;
  height: number;
  prims: Prim[];
}

export interface GenParams {
  style: StyleId;
  paletteId: string;
  seed: number;
  cols: number;
  rows: number;
  /** 0..1 — how busy the composition is (fraction of cells filled, accents, etc). */
  density: number;
}

export type ModuleFn = (args: {
  rng: import("./rng").Rng;
  palette: Palette;
  cols: number;
  rows: number;
  density: number;
}) => Scene;
