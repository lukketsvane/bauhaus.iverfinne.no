import { CELL, type Palette, type Prim, type Scene } from "./types";

// Serialises a Scene + poster chrome (frame, title, year, caption) to an SVG
// string. Used both for on-screen rendering (dangerouslySetInnerHTML) and for
// PNG/SVG export, so what you see is exactly what you save.

export interface PosterText {
  title: string;
  year: string;
  caption: string;
  site: string;
}

// Layout constants, in CELL units.
const PAD = CELL * 0.62;
const TITLE_H = CELL * 2.05; // two stacked lines: title + year
const CAPTION_H = CELL * 0.95; // two stacked caption lines
const FONT = `'Helvetica Neue', Helvetica, Arial, sans-serif`;

export interface PosterLayout {
  pw: number;
  ph: number;
  artX: number;
  artY: number;
  artW: number;
  artH: number;
}

export function posterLayout(scene: Scene): PosterLayout {
  const artW = scene.width;
  const artH = scene.height;
  return {
    pw: artW + PAD * 2,
    ph: PAD + TITLE_H + artH + CAPTION_H + PAD * 0.4,
    artX: PAD,
    artY: PAD + TITLE_H,
    artW,
    artH,
  };
}

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
  opts: { standalone?: boolean; clipId?: string } = {},
): string {
  const L = posterLayout(scene);
  const clipId = opts.clipId ?? "artclip";
  const xmlns = opts.standalone ? ` xmlns="http://www.w3.org/2000/svg"` : "";

  const titleSize = CELL * 0.78;
  const yearSize = CELL * 0.78;
  const capSize = CELL * 0.18;
  const titleY = PAD + titleSize * 0.82;
  const yearY = titleY + yearSize * 1.0;
  const capLine2 = L.ph - PAD * 0.5;
  const capLine1 = capLine2 - capSize * 1.35;

  const art = scene.prims.map(primToSvg).join("");

  return `<svg${xmlns} viewBox="0 0 ${L.pw} ${L.ph}" preserveAspectRatio="xMidYMid meet">
  <defs><clipPath id="${clipId}"><rect x="${L.artX}" y="${L.artY}" width="${L.artW}" height="${L.artH}"/></clipPath></defs>
  <rect x="0" y="0" width="${L.pw}" height="${L.ph}" fill="${palette.bg}"/>
  <g clip-path="url(#${clipId})">
    <rect x="${L.artX}" y="${L.artY}" width="${L.artW}" height="${L.artH}" fill="${palette.bg}"/>
    ${art}
  </g>
  <text x="${L.artX}" y="${titleY}" font-family="${FONT}" font-weight="800" font-size="${titleSize}" letter-spacing="${-titleSize * 0.03}" fill="${palette.ink}">${esc(text.title)}</text>
  <text x="${L.artX}" y="${yearY}" font-family="${FONT}" font-weight="800" font-size="${yearSize}" letter-spacing="${-yearSize * 0.03}" fill="${palette.ink}">${esc(text.year)}</text>
  <text x="${L.artX}" y="${capLine1}" font-family="${FONT}" font-weight="700" font-size="${capSize}" letter-spacing="${capSize * 0.08}" fill="${palette.ink}">${esc(text.caption.toUpperCase())}</text>
  <text x="${L.artX}" y="${capLine2}" font-family="${FONT}" font-weight="700" font-size="${capSize}" letter-spacing="${capSize * 0.08}" fill="${palette.ink}">${esc(text.site.toUpperCase())}</text>
</svg>`;
}
