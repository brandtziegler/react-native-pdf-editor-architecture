// src/domain/geometry/Rect.ts

/** Percent-based box relative to a page (0..1 or 0..100 depending on your convention). */
export type PercentRect = {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
};

/** Pixel-based box relative to the rendered viewport. */
export type PixelRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};
