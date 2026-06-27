import { CELL, type ModuleFn, type Prim } from "../types";
import { mix } from "../color";

// Isometric "tumbling blocks": each cube is three rhombi (top / left / right)
// on a pointy-top hex lattice, tiling edge-to-edge. Overdraws past the art
// rect; the renderer clips to the viewBox. (Reference poster: Bauhaus 1923, ink + bone.)

export const isocubes: ModuleFn = ({ rng, palette, cols, rows, density }) => {
  const W = cols * CELL;
  const H = rows * CELL;
  const prims: Prim[] = [];

  const base = palette.colors[0];
  const light = palette.bg;
  const top = mix(base, light, 0.86); // bright top face
  const right = mix(base, light, 0.42); // mid face
  const left = base; // dark face
  const stroke = mix(base, light, 0.2);
  const sw = CELL * 0.02;

  // cube size — scale so ~cols cubes fit across
  const R = (CELL * 0.95) / Math.sqrt(3) + density * 4;
  const wx = (Math.sqrt(3) / 2) * R; // half width
  const colStep = Math.sqrt(3) * R;
  const rowStep = 1.5 * R;

  const poly = (pts: Array<[number, number]>, fill: string): Prim => ({
    kind: "poly",
    pts,
    fill,
    stroke,
    sw,
  });

  for (let row = -1; rowStep * row <= H + R * 2; row++) {
    const cy = row * rowStep;
    const offset = row % 2 === 0 ? 0 : colStep / 2;
    for (let col = -1; colStep * col + offset <= W + R * 2; col++) {
      const cx = col * colStep + offset;

      // Multi-colour palettes → each cube gets its own base colour (vibrant
      // tumbling blocks). 2-colour palettes keep the classic single-base look
      // with an occasional accent.
      let b: string;
      if (palette.colors.length > 2) {
        b = rng.pick(palette.colors);
      } else {
        b = palette.colors.length > 1 && rng.chance(0.16 + density * 0.1) ? palette.colors[1] : base;
      }
      const tTop = mix(b, light, 0.86);
      const tRight = mix(b, light, 0.42);
      const tLeft = b;

      prims.push(poly([[cx, cy - R], [cx + wx, cy - R / 2], [cx, cy], [cx - wx, cy - R / 2]], tTop));
      prims.push(poly([[cx - wx, cy - R / 2], [cx, cy], [cx, cy + R], [cx - wx, cy + R / 2]], tLeft));
      prims.push(poly([[cx, cy], [cx + wx, cy - R / 2], [cx + wx, cy + R / 2], [cx, cy + R]], tRight));
    }
  }

  return { width: W, height: H, prims };
};
