"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dice5, Download, ChevronLeft, ChevronRight, Minus, Plus, Share2, FileCode2,
  Flower2, Circle, Box, Boxes, LayoutGrid, type LucideIcon,
} from "lucide-react";
import { STYLES } from "@/lib/bauhaus/generate";
import { PALETTES, DEFAULT_PALETTE } from "@/lib/bauhaus/palettes";
import { Rng, randomSeed, seedToString, stringToSeed } from "@/lib/bauhaus/rng";
import { ART_REGION_RATIO } from "@/lib/bauhaus/svg";
import type { GenParams, StyleId } from "@/lib/bauhaus/types";
import type { PosterText } from "@/lib/bauhaus/svg";
import PosterCanvas, { buildSvg } from "./poster-canvas";

const YEARS = ["1919", "1923", "1925", "1928", "1933"];
const SITE = "bauhaus.iverfinne.no";
const DEFAULT_SEED = 1337;

const STYLE_ICON: Record<StyleId, LucideIcon> = {
  petals: Flower2,
  semicircles: Circle,
  blocks: Box,
  isocubes: Boxes,
  mondrian: LayoutGrid,
};

// Pick a grid whose rows follow the fixed art-region ratio, so cells stay
// square and the art fills the region on every poster.
function deriveLayout(style: StyleId, seed: number) {
  const meta = STYLES.find((s) => s.id === style)!;
  const r = new Rng((seed ^ 0x5bd1e995) >>> 0);
  const cols = r.int(meta.cols[0], meta.cols[1]);
  const rows = Math.max(2, Math.round(cols * ART_REGION_RATIO));
  return { cols, rows, year: r.pick(YEARS) };
}

function readHash(): { style?: StyleId; palette?: string; seed?: number; density?: number } {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const style = p.get("s") as StyleId | null;
  const seed = p.get("seed") ? stringToSeed(p.get("seed")!) : null;
  const d = p.get("d");
  return {
    style: style && STYLES.some((x) => x.id === style) ? style : undefined,
    palette: p.get("p") ?? undefined,
    seed: seed ?? undefined,
    density: d ? Math.max(0, Math.min(1, parseFloat(d))) : undefined,
  };
}

export default function BauhausCreator() {
  const [style, setStyle] = useState<StyleId>("petals");
  const [paletteId, setPaletteId] = useState<string>(DEFAULT_PALETTE.petals);
  const [seed, setSeed] = useState<number>(DEFAULT_SEED);
  const [density, setDensity] = useState<number>(0.6);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const h = readHash();
    if (h.style) setStyle(h.style);
    if (h.palette) setPaletteId(h.palette);
    if (h.density != null) setDensity(h.density);
    setSeed(h.seed ?? randomSeed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { cols, rows, year } = useMemo(() => deriveLayout(style, seed), [style, seed]);

  const params: GenParams = useMemo(
    () => ({ style, paletteId, seed, cols, rows, density }),
    [style, paletteId, seed, cols, rows, density],
  );

  const styleName = STYLES.find((s) => s.id === style)!.name;
  const text: PosterText = useMemo(
    () => ({ title: "Bauhaus", year, caption: `${styleName} · ${seedToString(seed)}`, site: SITE }),
    [year, styleName, seed],
  );

  useEffect(() => {
    const p = new URLSearchParams({ s: style, p: paletteId, seed: seedToString(seed), d: density.toFixed(2) });
    window.history.replaceState(null, "", `#${p.toString()}`);
  }, [style, paletteId, seed, density]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1400);
  }, []);

  const regenerate = useCallback(() => setSeed(randomSeed()), []);

  const stepStyle = useCallback(
    (dir: number) => {
      const idx = STYLES.findIndex((s) => s.id === style);
      const next = STYLES[(idx + dir + STYLES.length) % STYLES.length];
      setStyle(next.id);
      setPaletteId(DEFAULT_PALETTE[next.id]);
    },
    [style],
  );

  const exportPng = useCallback(async () => {
    const svg = buildSvg(params, text, true);
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("svg load failed"));
      img.src = url;
    });
    const targetW = 2000;
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = Math.round((targetW * (img.height || 1500)) / (img.width || 1000));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `bauhaus-${style}-${seedToString(seed)}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("PNG");
    }, "image/png");
  }, [params, text, style, seed, showToast]);

  const exportSvg = useCallback(() => {
    const svg = buildSvg(params, text, true);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    a.download = `bauhaus-${style}-${seedToString(seed)}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("SVG");
  }, [params, text, style, seed, showToast]);

  const share = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "Bauhaus", url });
      else {
        await navigator.clipboard.writeText(url);
        showToast("Copied");
      }
    } catch {
      /* cancelled */
    }
  }, [showToast]);

  const adjustDensity = (delta: number) =>
    setDensity((d) => Math.max(0.2, Math.min(1, Math.round((d + delta) * 10) / 10)));

  const StyleIcon = STYLE_ICON[style];
  const level = Math.max(1, Math.min(5, Math.round(density * 5)));

  return (
    <div className="creator">
      <div className="stage" onClick={regenerate} title="Regenerate">
        <PosterCanvas params={params} text={text} />
      </div>

      <div className="bar" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <button className="stepper" onClick={() => stepStyle(-1)} aria-label="Previous style">
            <ChevronLeft size={18} />
          </button>
          <span className="style-icon" aria-label={styleName} title={styleName}>
            <StyleIcon size={20} />
          </span>
          <button className="stepper" onClick={() => stepStyle(1)} aria-label="Next style">
            <ChevronRight size={18} />
          </button>

          <div className="swatches">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                className={`swatch${p.id === paletteId ? " active" : ""}`}
                onClick={() => setPaletteId(p.id)}
                aria-label={p.name}
                title={p.name}
              >
                {p.colors.slice(0, 3).map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </button>
            ))}
          </div>
        </div>

        <div className="row">
          <div className="density" aria-label={`Density ${level} of 5`}>
            <button onClick={() => adjustDensity(-0.2)} aria-label="Less density"><Minus size={16} /></button>
            <span className="dots">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={i < level ? "on" : ""} />
              ))}
            </span>
            <button onClick={() => adjustDensity(0.2)} aria-label="More density"><Plus size={16} /></button>
          </div>
          <div className="spacer" />
          <button className="action" onClick={share} aria-label="Share"><Share2 size={18} /></button>
          <button className="action" onClick={exportSvg} aria-label="Save SVG"><FileCode2 size={18} /></button>
          <button className="action" onClick={exportPng} aria-label="Save PNG"><Download size={18} /></button>
          <button className="action primary" onClick={regenerate} aria-label="Regenerate"><Dice5 size={18} /></button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
