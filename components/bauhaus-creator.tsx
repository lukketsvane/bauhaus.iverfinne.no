"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const HINT_KEY = "bh_hint_seen_v1";

function deriveLayout(style: StyleId, seed: number) {
  const meta = STYLES.find((s) => s.id === style)!;
  const r = new Rng((seed ^ 0x5bd1e995) >>> 0);
  const cols = r.int(meta.cols[0], meta.cols[1]);
  const rows = Math.max(2, Math.round(cols * ART_REGION_RATIO));
  return { cols, rows, year: r.pick(YEARS) };
}

function readHash() {
  if (typeof window === "undefined") return {} as Record<string, string>;
  const p = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return Object.fromEntries(p.entries());
}

export default function BauhausCreator() {
  const [style, setStyle] = useState<StyleId>("petals");
  const [paletteId, setPaletteId] = useState<string>(DEFAULT_PALETTE.petals);
  const [seed, setSeed] = useState<number>(DEFAULT_SEED);
  const [density, setDensity] = useState<number>(0.6);
  const [toast, setToast] = useState<React.ReactNode>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const h = readHash();
    if (h.s && STYLES.some((x) => x.id === h.s)) setStyle(h.s as StyleId);
    if (h.p && PALETTES.some((x) => x.id === h.p)) setPaletteId(h.p);
    if (h.d) setDensity(Math.max(0.2, Math.min(1, parseFloat(h.d))));
    const s = h.seed ? stringToSeed(h.seed) : null;
    setSeed(s ?? randomSeed());
    try {
      if (!localStorage.getItem(HINT_KEY)) setShowHint(true);
    } catch {
      /* ignore */
    }
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

  const toastTimer = useRef<number>(0);
  const flash = useCallback((node: React.ReactNode) => {
    setToast(node);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1100);
  }, []);

  const dots = (lvl: number) => (
    <span className="dots">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={i < lvl ? "on" : ""} />
      ))}
    </span>
  );

  const regenerate = useCallback(() => setSeed(randomSeed()), []);

  const stepStyle = useCallback((dir: number) => {
    setStyle((cur) => {
      const idx = STYLES.findIndex((s) => s.id === cur);
      const next = STYLES[(idx + dir + STYLES.length) % STYLES.length];
      setPaletteId(DEFAULT_PALETTE[next.id]);
      flash(<span>{next.name}</span>);
      return next.id;
    });
  }, [flash]);

  const cyclePalette = useCallback(() => {
    setPaletteId((cur) => {
      const idx = PALETTES.findIndex((p) => p.id === cur);
      const next = PALETTES[(idx + 1) % PALETTES.length];
      flash(
        <span className="swatch-flash">
          {next.colors.slice(0, 3).map((c, i) => (
            <span key={i} style={{ background: c }} />
          ))}
          {next.name}
        </span>,
      );
      return next.id;
    });
  }, [flash]);

  const stepDensity = useCallback((delta: number) => {
    setDensity((d) => {
      const nd = Math.max(0.2, Math.min(1, Math.round((d + delta) * 10) / 10));
      flash(dots(Math.round(nd * 5)));
      return nd;
    });
  }, [flash]);

  const makePngBlob = useCallback(async (): Promise<Blob | null> => {
    const svg = buildSvg(params, text, true);
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("load"));
        img.src = url;
      });
      const w = 2000;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = Math.round((w * (img.height || 1500)) / (img.width || 1000));
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      return await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [params, text]);

  const saveOrShare = useCallback(async () => {
    flash(<span>Saving…</span>);
    const blob = await makePngBlob();
    if (!blob) return;
    const file = new File([blob], `bauhaus-${style}-${seedToString(seed)}.png`, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    try {
      if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: "Bauhaus" });
        return;
      }
    } catch {
      return; // user cancelled
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
    flash(<span>Saved</span>);
  }, [makePngBlob, style, seed, flash]);

  // ---- gesture handling ----
  const g = useRef({ x: 0, y: 0, lx: 0, ly: 0, t: 0, moved: false, max: 1, handled: false, active: false });
  const lp = useRef<number>(0);
  const tf = useRef<number>(0);
  const clearTimers = () => {
    window.clearTimeout(lp.current);
    window.clearTimeout(tf.current);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const n = e.touches.length;
    if (!g.current.active) {
      const t = e.touches[0];
      g.current = { x: t.clientX, y: t.clientY, lx: t.clientX, ly: t.clientY, t: Date.now(), moved: false, max: n, handled: false, active: true };
    } else {
      g.current.max = Math.max(g.current.max, n);
    }
    clearTimers();
    if (n >= 2) {
      tf.current = window.setTimeout(() => {
        if (!g.current.handled) { g.current.handled = true; cyclePalette(); }
      }, 300);
    } else {
      lp.current = window.setTimeout(() => {
        if (!g.current.moved && !g.current.handled) { g.current.handled = true; saveOrShare(); }
      }, 500);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    g.current.lx = t.clientX;
    g.current.ly = t.clientY;
    if (Math.abs(t.clientX - g.current.x) > 12 || Math.abs(t.clientY - g.current.y) > 12) {
      g.current.moved = true;
      clearTimers();
    }
  };

  const lastTouchEnd = useRef<number>(0);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length > 0) return; // wait for all fingers up
    clearTimers();
    lastTouchEnd.current = Date.now();
    const st = g.current;
    g.current.active = false;
    if (st.handled) return;
    if (st.max >= 2) { cyclePalette(); return; }
    const ct = e.changedTouches[0];
    const dx = (ct ? ct.clientX : st.lx) - st.x;
    const dy = (ct ? ct.clientY : st.y) - st.y;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (!st.moved || Math.max(ax, ay) < 40) { regenerate(); return; }
    if (ax >= ay) stepStyle(dx < 0 ? 1 : -1);
    else stepDensity(dy < 0 ? 0.2 : -0.2);
  };

  // ---- keyboard (desktop) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight": stepStyle(1); break;
        case "ArrowLeft": stepStyle(-1); break;
        case "ArrowUp": stepDensity(0.2); break;
        case "ArrowDown": stepDensity(-0.2); break;
        case "c": case "C": cyclePalette(); break;
        case "s": case "S": saveOrShare(); break;
        case "?": setShowHint((v) => !v); break;
        case " ": case "Enter": regenerate(); break;
        default: return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepStyle, stepDensity, cyclePalette, saveOrShare, regenerate]);

  const dismissHint = () => {
    setShowHint(false);
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* ignore */ }
  };

  return (
    <div
      className="creator"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={() => {
        // desktop mouse click regenerates; ignore the synthetic click that
        // follows a touch gesture (handled in onTouchEnd).
        if (Date.now() - lastTouchEnd.current < 700) return;
        regenerate();
      }}
    >
      <div className="stage">
        <PosterCanvas key={`${style}|${paletteId}|${seed}|${density}`} params={params} text={text} />
      </div>

      <button
        className="hint-toggle"
        aria-label="Gestures"
        onClick={(e) => { e.stopPropagation(); setShowHint(true); }}
      >
        ?
      </button>

      {toast && <div className="toast">{toast}</div>}

      {showHint && (
        <div className="hint" onClick={dismissHint}>
          <div className="hint-card">
            <h2>Bauhaus</h2>
            <ul>
              <li><b>Tap</b><span>new variant</span></li>
              <li><b>Swipe ← →</b><span>style</span></li>
              <li><b>Swipe ↑ ↓</b><span>density</span></li>
              <li><b>Two fingers</b><span>colour theme</span></li>
              <li><b>Hold</b><span>save / share</span></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
