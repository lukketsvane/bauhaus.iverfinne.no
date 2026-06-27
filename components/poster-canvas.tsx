"use client";

import { useMemo } from "react";
import { generate } from "@/lib/bauhaus/generate";
import { getPalette } from "@/lib/bauhaus/palettes";
import { sceneToPosterSvg, type PosterText } from "@/lib/bauhaus/svg";
import type { GenParams } from "@/lib/bauhaus/types";

export function buildSvg(
  params: GenParams,
  text: PosterText,
  standalone = false,
  caption: "full" | "minimal" = "full",
): string {
  const scene = generate(params);
  const palette = getPalette(params.paletteId);
  return sceneToPosterSvg(scene, palette, text, { standalone, caption });
}

export default function PosterCanvas({
  params,
  text,
}: {
  params: GenParams;
  text: PosterText;
}) {
  // On screen the style·seed line is hidden; the exported PNG/SVG keeps it.
  const svg = useMemo(() => buildSvg(params, text, false, "minimal"), [params, text]);
  return (
    <div
      className="poster-canvas"
      // SVG is generated deterministically from the seed, so server and client
      // markup match — safe to inject.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
