import type { Palette, StyleId } from "./types";

// Palettes sampled from the reference posters, plus a couple of classic
// Bauhaus extensions. Any palette can be used with any style.

export const PALETTES: Palette[] = [
  {
    id: "lime-blue",
    name: "Lime / Blue",
    bg: "#E9E5D6",
    ink: "#1a1a1a",
    colors: ["#A7B41C", "#3C6FA0"],
  },
  {
    id: "sage",
    name: "Sage / Ink",
    bg: "#E8E4D6",
    ink: "#1b1b1b",
    colors: ["#1d1d1b", "#7E9476"],
  },
  {
    id: "orange",
    name: "Orange / Ink",
    bg: "#ECE7D8",
    ink: "#161616",
    colors: ["#16161a", "#E2742B"],
  },
  {
    id: "mono",
    name: "Ink / Bone",
    bg: "#E9E4D5",
    ink: "#141414",
    colors: ["#141414", "#E9E4D5"],
  },
  {
    id: "primary",
    name: "De Stijl",
    bg: "#F2EFE6",
    ink: "#111111",
    colors: ["#D5362A", "#1E50A0", "#F2C12E"],
  },
  {
    id: "bauhaus",
    name: "Bauhaus",
    bg: "#EDE7D7",
    ink: "#141414",
    colors: ["#D5362A", "#1E50A0", "#F2C12E", "#141414"],
  },
  {
    id: "prisma",
    name: "Prisma",
    bg: "#EFEBDD",
    ink: "#141414",
    colors: ["#D5362A", "#1E50A0", "#F2C12E", "#2C9E5B", "#141414"],
  },
];

export const PALETTE_BY_ID: Record<string, Palette> = Object.fromEntries(
  PALETTES.map((p) => [p.id, p]),
);

export function getPalette(id: string): Palette {
  return PALETTE_BY_ID[id] ?? PALETTES[0];
}

// Which palette looks best as the default for each style (matches references).
export const DEFAULT_PALETTE: Record<StyleId, string> = {
  petals: "lime-blue",
  semicircles: "sage",
  blocks: "orange",
  isocubes: "mono",
  mondrian: "primary",
  quarters: "prisma",
  arches: "prisma",
  medley: "prisma",
  tiles: "mono",
};
