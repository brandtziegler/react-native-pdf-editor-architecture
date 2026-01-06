// src/contracts/PdfRendererPort.ts
import type {
  RendererInboundMessage,
  RendererOutboundCommand,
} from "../application/events/RendererMessages";

export type RendererHtmlParams = {
  /** 1-based page number used by the renderer */
  pageNumber: number;
  /** Display scale (e.g., 1.0, 1.25, 1.5) */
  scale: number;
};

/**
 * Port for the PDF renderer bridge (WebView or equivalent).
 * Public repo: defines the boundary + protocol, not the implementation.
 */
export interface PdfRendererPort {
  /**
   * Build the HTML shell used by the renderer for a given page/scale.
   * Implementation redacted (this is where private renderer wiring lives).
   */
  buildHtml(params: RendererHtmlParams): string;

  /**
   * Parse raw inbound message (from WebView postMessage) into a typed event.
   */
  parseInboundMessage(raw: string): RendererInboundMessage | null;

  /**
   * Serialize an outbound command (to WebView postMessage).
   */
  serializeCommand(cmd: RendererOutboundCommand): string;
}

/**
 * Optional helper type representing an adapter that can send messages
 * to the underlying renderer (WebView ref, iframe, etc.).
 * (Non-runnable showcase; concrete implementations omitted.)
 */
export interface RendererTransport {
  postMessage(message: string): void;
}
