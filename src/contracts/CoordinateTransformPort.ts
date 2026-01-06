// src/contracts/CoordinateTransformPort.ts
import type { PercentRect, PixelRect } from "../domain/geometry/Rect";

export type PdfPageMeta = {
  /** 0-based page index */
  pageIndex: number;

  /** PDF page dimensions in PDF units (or pixels as extracted). */
  width: number;
  height: number;

  /**
   * Normalized rotation for the page.
   * Keep this at the contract level; the math is private.
   */
  rotation?: 0 | 90 | 180 | 270;

  /**
   * Crop/trim information may exist in the private implementation.
   * Omitted here on purpose (redacted).
   */
};

export type ViewportMeta = {
  width: number;
  height: number;
  /** Renderer scale factor (e.g. 1.0, 1.25, 1.5) */
  scale: number;
  /** Viewport rotation (if applicable) */
  rotation?: 0 | 90 | 180 | 270;
};

/**
 * Contract for converting between:
 * - extracted PDF coordinate boxes
 * - normalized percent rects
 * - viewport pixel rects used for overlays
 *
 * Implementation (cropbox + rotation + axis transforms) is proprietary and intentionally omitted.
 */
export interface CoordinateTransformPort {
  /**
   * Convert a raw extracted PDF box into a percent-based rectangle.
   * Percent convention is defined by PercentRect fields (leftPct/topPct/widthPct/heightPct).
   */
  toPercentRect(args: {
    coords: readonly [number, number, number, number] | number[];
    page: PdfPageMeta;
  }): PercentRect;

  /**
   * Convert a percent rect into a pixel rect for overlay hit-testing/rendering.
   */
  toPixelRect(args: {
    rect: PercentRect;
    viewport: ViewportMeta;
  }): PixelRect;

  /**
   * Optional: given a pixel point in the viewport, return whether it hits a rect.
   * This keeps hit-testing logic consistent without exposing private transforms.
   */
  hitTest(args: {
    point: { x: number; y: number };
    rect: PixelRect;
    paddingPx?: number;
  }): boolean;
}

