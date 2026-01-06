// src/contracts/ClockPort.ts

/**
 * Minimal clock abstraction.
 * Useful for documenting time-based behavior (debounce/quiet-window) without
 * hardcoding timers in the architecture layer.
 */
export interface ClockPort {
  nowMs(): number;

  /**
   * Schedule a callback. Implementation might use setTimeout, requestAnimationFrame,
   * InteractionManager, etc. Public repo keeps this abstract.
   */
  setTimeout(fn: () => void, delayMs: number): unknown;

  /** Cancel a scheduled callback created by setTimeout. */
  clearTimeout(handle: unknown): void;
}
