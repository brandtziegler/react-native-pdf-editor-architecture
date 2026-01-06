// src/contracts/OverlayGatePort.ts

/**
 * Port for “overlay gating” / stabilization.
 *
 * In the private app this abstracts:
 * - renderer settling (dims updates, render-done signals)
 * - a quiet window / debounce period
 * - the moment overlays are allowed to appear (avoid flicker/misalignment)
 *
 * Public repo: contract only. Timing heuristics are proprietary and omitted.
 */
export interface OverlayGatePort {
  /**
   * Called when renderer state changes (e.g., dimensions update, page change, scale change).
   * Typically resets the “quiet window”.
   */
  markTick(reason?: string): void;

  /**
   * Called when the renderer signals it has finished drawing the page (e.g., RENDER_DONE).
   */
  markRenderDone(): void;

  /**
   * Returns whether it is currently safe to show overlays.
   * (Implementation decides; public repo exposes the concept.)
   */
  canShowOverlays(): boolean;

  /**
   * Optional: force-hide overlays immediately (e.g., before refresh, before page jump).
   */
  maskOverlays(reason?: string): void;

  /**
   * Optional: request that overlays become visible once the gate decides it’s safe.
   */
  requestUnmask(reason?: string): void;
}
