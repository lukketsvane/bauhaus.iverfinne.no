import { type Palette, type Prim, type Scene } from "./types";

// Serialises a Scene + poster chrome (frame, title, year, caption) to an SVG
// string. The poster is ALWAYS a fixed 2:3 portrait; the generated art is
// scaled to fit a fixed art region (square cells preserved, centred, clipped),
// so every poster has identical proportions regardless of grid size.

export interface PosterText {
  title: string;
  year: string;
  caption: string;
  site: string;
}

// Fixed poster geometry (poster units).
const PW = 1000;
const PH = 1500;
const PAD = 72;
const TITLE_SIZE = 112;
const CAP_SIZE = 26;

const ART_X = PAD;
const ART_Y = 300;
const ART_W = PW - PAD * 2; // 856
const ART_H = PH - 120 - ART_Y; // 1080

const FONT = `'Helvetica Neue', Helvetica, Arial, sans-serif`;

/** Aspect ratio (rows/cols) the art region wants, so callers can pick a grid
 *  that fills it with square cells. */
export const ART_REGION_RATIO = ART_H / ART_W;
export const POSTER_RATIO = PW / PH;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function primToSvg(p: Prim): string {
  const stroke = p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.sw ?? 1}"` : "";
  switch (p.kind) {
    case "rect":
      return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${p.fill}"${stroke}/>`;
    case "circle":
      return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${p.fill}"${stroke}/>`;
    case "path":
      return `<path d="${p.d}" fill="${p.fill}"${stroke}/>`;
    case "poly":
      return `<polygon points="${p.pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")}" fill="${p.fill}"${stroke}/>`;
  }
}

export function sceneToPosterSvg(
  scene: Scene,
  palette: Palette,
  text: PosterText,
  opts: { standalone?: boolean; clipId?: string; caption?: "full" | "minimal" } = {},
): string {
  const clipId = opts.clipId ?? "artclip";
  const xmlns = opts.standalone ? ` xmlns="http://www.w3.org/2000/svg"` : "";
  // explicit intrinsic size so the SVG rasterises correctly when drawn to canvas
  const size = opts.standalone ? ` width="${PW}" height="${PH}"` : "";

  // fit + centre the generated scene into the fixed art region
  const scale = Math.min(ART_W / scene.width, ART_H / scene.height);
  const tx = ART_X + (ART_W - scene.width * scale) / 2;
  const ty = ART_Y + (ART_H - scene.height * scale) / 2;

  const titleY = PAD + TITLE_SIZE * 0.78;
  const yearY = titleY + TITLE_SIZE * 0.98;
  const capLine2 = PH - 48;
  const capLine1 = capLine2 - CAP_SIZE * 1.35;

  const art = scene.prims.map(primToSvg).join("");

  // "minimal" (on screen) drops the style·seed line; "full" (export) keeps it.
  const cap = (y: number, s: string) =>
    `<text x="${ART_X}" y="${y}" font-family="${FONT}" font-weight="700" font-size="${CAP_SIZE}" letter-spacing="${CAP_SIZE * 0.08}" fill="${palette.ink}">${esc(s.toUpperCase())}</text>`;
  const caption =
    (opts.caption ?? "full") === "minimal"
      ? cap(capLine2, text.site)
      : cap(capLine1, text.caption) + cap(capLine2, text.site);

  return `<svg${xmlns}${size} viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="xMidYMid meet">
  <defs><clipPath id="${clipId}"><rect x="${ART_X}" y="${ART_Y}" width="${ART_W}" height="${ART_H}"/></clipPath></defs>
  <rect x="0" y="0" width="${PW}" height="${PH}" fill="${palette.bg}"/>
  <g clip-path="url(#${clipId})">
    <g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${scale.toFixed(4)})">${art}</g>
  </g>
  <text x="${ART_X}" y="${titleY}" font-family="${FONT}" font-weight="800" font-size="${TITLE_SIZE}" letter-spacing="${-TITLE_SIZE * 0.03}" fill="${palette.ink}">${esc(text.title)}</text>
  <text x="${ART_X}" y="${yearY}" font-family="${FONT}" font-weight="800" font-size="${TITLE_SIZE}" letter-spacing="${-TITLE_SIZE * 0.03}" fill="${palette.ink}">${esc(text.year)}</text>
  ${caption}
</svg>`;
}
