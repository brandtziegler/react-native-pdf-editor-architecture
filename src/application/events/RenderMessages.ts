// src/application/events/RendererMessages.ts
// Public-facing renderer bridge protocol (non-runnable showcase).
// This defines the *shape* of messages — not the renderer implementation.

export type RendererInboundMessage =
  | { type: "READY" }
  | { type: "PDF_DIMENSIONS"; width: number; height: number; scale: number; rotation?: number }
  | { type: "RENDER_DONE" }
  | { type: "READY_FOR_OVERLAYS" }
  | { type: "DEBUG_PAGE_COUNT"; pages: number };

export type RendererOutboundCommand =
  /**
   * In the private implementation this may be sent as a raw base64 string.
   * Here we keep a typed command form for clarity.
   */
  | { type: "LOAD_PDF_BASE64"; base64: string }
  | { type: "SET_PAGE"; pageNumber: number }
  | { type: "SET_SCALE"; scale: number };

export function parseRendererInboundMessage(raw: string): RendererInboundMessage | null {
  try {
    const data = JSON.parse(raw) as any;
    if (!data || typeof data.type !== "string") return null;

    switch (data.type) {
      case "READY":
      case "RENDER_DONE":
      case "READY_FOR_OVERLAYS":
        return { type: data.type };

      case "PDF_DIMENSIONS":
        return {
          type: "PDF_DIMENSIONS",
          width: Number(data.width),
          height: Number(data.height),
          scale: Number(data.scale),
          rotation: data.rotation == null ? undefined : Number(data.rotation),
        };

      case "DEBUG_PAGE_COUNT":
        return { type: "DEBUG_PAGE_COUNT", pages: Number(data.pages) };

      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function serializeRendererCommand(cmd: RendererOutboundCommand): string {
  return JSON.stringify(cmd);
}
