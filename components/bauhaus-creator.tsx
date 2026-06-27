"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dice5, Download, ChevronLeft, ChevronRight, Minus, Plus, Share2 } from "lucide-react";
import { STYLES } from "@/lib/bauhaus/generate";
import { PALETTES, DEFAULT_PALETTE, getPalette } from "@/lib/bauhaus/palettes";
import { Rng, randomSeed, seedToString, stringToSeed } from "@/lib/bauhaus/rng";
import type { GenParams, StyleId } from "@/lib/bauhaus/types";
import type { PosterText } from "@/lib/bauhaus/svg";
import PosterCanvas, { buildSvg } from "./poster-canvas";

const YEARS = ["1919", "1923", "1925", "1928", "1933"];
const SITE = "bauhaus.iverfinne.no";
const DEFAULT_SEED = 1337;

function deriveLayout(style: StyleId, seed: number) {
  const meta = STYLES.find((s) => s.id === style)!;
  const r = new Rng((seed ^ 0x5bd1e995) >>> 0);
  return {
    cols: r.int(meta.cols[0], meta.cols[1]),
    rows: r.int(meta.rows[0], meta.rows[1]),
    year: r.pick(YEARS),
  };
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
  const [density, setDensity] = useState<number>(0.55);
  const [toast, setToast] = useState<string | null>(null);

  // Hydrate from URL hash (after mount → no SSR mismatch).
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
    () => ({
      title: "Bauhaus",
      year,
      caption: `${styleName} · ${seedToString(seed)}`,
      site: SITE,
    }),
    [year, styleName, seed],
  );

  // Keep URL hash in sync for shareable links.
  useEffect(() => {
    const p = new URLSearchParams({ s: style, p: paletteId, seed: seedToString(seed), d: density.toFixed(2) });
    window.history.replaceState(null, "", `#${p.toString()}`);
  }, [style, paletteId, seed, density]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
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
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("svg load failed"));
      img.src = url;
    });
    const targetW = 2000;
    const ratio = img.height / img.width || 1.3;
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = Math.round(targetW * ratio);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `bauhaus-${style}-${seedToString(seed)}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("PNG saved");
    }, "image/png");
  }, [params, text, style, seed, showToast]);

  const exportSvg = useCallback(() => {
    const svg = buildSvg(params, text, true);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bauhaus-${style}-${seedToString(seed)}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("SVG saved");
  }, [params, text, style, seed, showToast]);

  const share = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "Bauhaus", url });
      else {
        await navigator.clipboard.writeText(url);
        showToast("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  }, [showToast]);

  const adjustDensity = (delta: number) =>
    setDensity((d) => Math.max(0, Math.min(1, Math.round((d + delta) * 100) / 100)));

  return (
    <div className="creator">
      <div className="stage" onClick={regenerate} title="Tap to regenerate">
        <PosterCanvas params={params} text={text} />
      </div>

      <div className="bar" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <button className="stepper" onClick={() => stepStyle(-1)} aria-label="Previous style">
            <ChevronLeft size={18} />
          </button>
          <span className="style-name">{styleName}</span>
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
          <div className="density">
            <button onClick={() => adjustDensity(-0.15)} aria-label="Less"><Minus size={16} /></button>
            <span>Density {Math.round(density * 100)}%</span>
            <button onClick={() => adjustDensity(0.15)} aria-label="More"><Plus size={16} /></button>
          </div>
          <div className="spacer" />
          <button className="action" onClick={share} aria-label="Share"><Share2 size={18} /></button>
          <button className="action" onClick={exportSvg} aria-label="Save SVG"><span className="lbl">SVG</span></button>
          <button className="action" onClick={exportPng} aria-label="Save PNG"><Download size={18} /></button>
          <button className="action primary" onClick={regenerate} aria-label="Regenerate"><Dice5 size={18} /></button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
