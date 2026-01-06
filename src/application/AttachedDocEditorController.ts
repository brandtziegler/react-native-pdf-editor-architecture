// src/application/AttachedDocEditorController.ts
/**
 * Architecture showcase: orchestration/controller extracted from a private React Native PDF editor.
 *
 * Intentionally NON-runnable:
 * - No filesystem reads
 * - No WebView implementation
 * - No proprietary geometry/timing/signature internals
 *
 * What this file DOES show:
 * - module boundaries (ports)
 * - state transitions
 * - renderer message handling
 * - edit intents (text/checkbox/signature/clear)
 */

import type { PdfField } from "../domain/pdf/PdfField";
import type {
  OpenPdfInstanceRequest,
  OpenPdfInstanceResult,
  PdfDocRef,
} from "../domain/pdf/PdfTypes";

import type { PdfRendererPort, RendererTransport } from "../contracts/PdfRendererPort";
import type { PdfFieldExtractorPort } from "../contracts/PdfFieldExtractorPort";
import type { PdfFieldWriterPort } from "../contracts/PdfFieldWriterPort";
import type { PdfInstanceManagerPort } from "../contracts/PdfInstanceManagerPort";
import type { TemplateStorePort } from "../contracts/TemplateStorePort";
import type { CoordinateTransformPort } from "../contracts/CoordinateTransformPort";
import type { OverlayGatePort } from "../contracts/OverlayGatePort";
import type { ClockPort } from "../contracts/ClockPort";

import type {
  RendererInboundMessage,
  RendererOutboundCommand,
} from "./events/RendererMessages";

/** Minimal UI-facing snapshot. Keep this stable and boring. */
export type AttachedDocEditorSnapshot = {
  fileName: string | null;
  localPath: string | null;

  pageNumber: number; // 1-based
  scale: number;

  /** Whether renderer says it’s ready (e.g., READY received). */
  rendererReady: boolean;

  /** Whether overlays are allowed (quiet-window/gate says OK). */
  overlaysVisible: boolean;

  /** True if user has unsaved changes / pending save cycle. */
  isDirty: boolean;

  /** Current fields (template fields with values layered in). */
  fields: PdfField[];

  /** Selection state for modals/edits. */
  selectedFieldName: string | null;

  /** Optional last-known viewport info (from PDF_DIMENSIONS). */
  viewport?: {
    width: number;
    height: number;
    scale: number;
    rotation?: 0 | 90 | 180 | 270;
  };

  /** Optional status for UI ribbons/logging. */
  status?: string;
};

export type AttachedDocEditorDeps = {
  renderer: PdfRendererPort;
  fieldExtractor: PdfFieldExtractorPort;
  fieldWriter: PdfFieldWriterPort;
  instanceManager: PdfInstanceManagerPort;
  templateStore: TemplateStorePort;
  coordTransform: CoordinateTransformPort;
  overlayGate: OverlayGatePort;
  clock: ClockPort;

  /**
   * Optional: let UI receive snapshots.
   * (In private app, React state hooks do this; here we keep it abstract.)
   */
  onSnapshot?: (s: AttachedDocEditorSnapshot) => void;

  /** Optional: diagnostics hook */
  onLog?: (msg: string, extra?: Record<string, unknown>) => void;
  onError?: (err: unknown) => void;
};

export class AttachedDocEditorController {
  private deps: AttachedDocEditorDeps;

  private transport: RendererTransport | null = null;

  private fileName: string | null = null;
  private localPath: string | null = null;

  private pageNumber = 1;
  private scale = 1.0;

  private rendererReady = false;
  private overlaysVisible = false;
  private isDirty = false;

  private fields: PdfField[] = [];
  private selectedFieldName: string | null = null;

  private viewport:
    | { width: number; height: number; scale: number; rotation?: 0 | 90 | 180 | 270 }
    | undefined;

  private status?: string;

  constructor(deps: AttachedDocEditorDeps) {
    this.deps = deps;
    this.emit();
  }

  /**
   * Attach a message transport (e.g., WebView ref wrapper).
   * Public repo: transport is abstract; actual WebView wiring is private.
   */
  attachRendererTransport(transport: RendererTransport) {
    this.transport = transport;
  }

  /** UI can read this at any time. */
  getSnapshot(): AttachedDocEditorSnapshot {
    return {
      fileName: this.fileName,
      localPath: this.localPath,
      pageNumber: this.pageNumber,
      scale: this.scale,
      rendererReady: this.rendererReady,
      overlaysVisible: this.overlaysVisible,
      isDirty: this.isDirty,
      fields: this.fields,
      selectedFieldName: this.selectedFieldName,
      viewport: this.viewport,
      status: this.status,
    };
  }

  /**
   * Open a PDF instance:
   * - get a local working path
   * - extract fields
   * - normalize template
   * - prep renderer load (base64 send is redacted)
   */
  async openDocument(req: OpenPdfInstanceRequest): Promise<void> {
    try {
      this.status = "Opening document…";
      this.emit();

      const res: OpenPdfInstanceResult = await this.deps.instanceManager.open(req);
      this.fileName = req.fileName;
      this.localPath = res.localPath;

      // Store or reuse template mapping (public repo shows the concept).
      this.deps.templateStore.putTemplate(req.fileName, res.template);

      // Layer extracted values onto template (safe, non-proprietary).
      this.fields = this.layerValues(res.template, res.extractedFields);

      // Normalize template relative rects (REDACTED: private normalization rules)
      this.fields = await this.normalizeTemplate(this.fields);

      // If we already have viewport, compute scaled rects now.
      this.recomputeScaledRectsIfPossible();

      // Kick renderer to load the PDF content (REDACTED: base64 read + actual postMessage details).
      await this.loadIntoRenderer();

      this.status = "Ready";
      this.emit();
    } catch (err) {
      this.status = "Error opening document";
      this.emit();
      this.deps.onError?.(err);
      throw err;
    }
  }

  /**
   * Handle inbound messages from renderer (WebView postMessage -> raw string).
   * Your real app switch-cases READY / PDF_DIMENSIONS / RENDER_DONE etc.
   */
  onRendererMessage(raw: string) {
    const msg = this.deps.renderer.parseInboundMessage(raw);
    if (!msg) return;

    this.deps.onLog?.("Renderer message", { msgType: msg.type });

    // Any renderer activity is a "tick" for overlay gating.
    this.deps.overlayGate.markTick(msg.type);

    switch (msg.type) {
      case "READY": {
        this.rendererReady = true;

        // In private app: send PDF base64 now.
        // We keep it as a call path, but implementation is redacted.
        void this.loadIntoRenderer();

        this.emit();
        break;
      }

      case "PDF_DIMENSIONS": {
        this.viewport = {
          width: msg.width,
          height: msg.height,
          scale: msg.scale,
          rotation: msg.rotation as any,
        };

        // Whenever dims change, overlays should be masked until stable.
        this.deps.overlayGate.maskOverlays("dims-changed");
        this.overlaysVisible = false;

        // Recompute scaled rectangles now that viewport is known.
        this.recomputeScaledRectsIfPossible();

        this.emit();
        break;
      }

      case "RENDER_DONE": {
        // Renderer indicates the page is drawn; gate may allow overlays.
        this.deps.overlayGate.markRenderDone();
        this.deps.overlayGate.requestUnmask("render-done");

        this.overlaysVisible = this.deps.overlayGate.canShowOverlays();
        this.emit();
        break;
      }

      case "READY_FOR_OVERLAYS": {
        // Optional signal some renderers send; gate decides.
        this.deps.overlayGate.requestUnmask("renderer-ready-for-overlays");
        this.overlaysVisible = this.deps.overlayGate.canShowOverlays();
        this.emit();
        break;
      }

      case "DEBUG_PAGE_COUNT": {
        // Keep for logs only.
        this.deps.onLog?.("Renderer page count", { pages: msg.pages });
        break;
      }
    }
  }

  /** Change page (1-based). */
  setPage(pageNumber: number) {
    this.pageNumber = Math.max(1, Math.floor(pageNumber));
    this.maskOverlaysForNavigation("page-change");
    this.sendRendererCommand({ type: "SET_PAGE", pageNumber: this.pageNumber });
    this.emit();
  }

  /** Change scale. */
  setScale(scale: number) {
    this.scale = Math.max(0.1, scale);
    this.maskOverlaysForNavigation("scale-change");
    this.sendRendererCommand({ type: "SET_SCALE", scale: this.scale });
    this.emit();
  }

  /**
   * UI calls this when an overlay is pressed.
   * Controller selects the field; UI decides which modal to show.
   */
  selectField(fieldName: string | null) {
    this.selectedFieldName = fieldName;
    this.emit();
  }

  getSelectedField(): PdfField | null {
    if (!this.selectedFieldName) return null;
    return this.fields.find((f) => f.name === this.selectedFieldName) ?? null;
  }

  /** Save a text field. */
  async saveText(fieldName: string, value: string): Promise<void> {
    try {
      const field = this.mustFindField(fieldName);
      if (!this.localPath) throw new Error("No localPath");

      this.status = "Saving text…";
      this.isDirty = true;
      this.maskOverlaysForNavigation("save-text");
      this.emit();

      await this.deps.fieldWriter.writeText({ localPdfPath: this.localPath, field, value });

      // Update local state value
      this.fields = this.fields.map((f) => (f.name === fieldName ? { ...f, value } : f));

      // Renderer refresh strategy is proprietary; keep as a conceptual call.
      await this.refreshRendererAfterSave();

      this.status = "Saved";
      this.emit();
    } catch (err) {
      this.status = "Error saving text";
      this.emit();
      this.deps.onError?.(err);
      throw err;
    }
  }

  /** Toggle a checkbox. */
  async toggleCheckbox(fieldName: string, nextValue?: boolean): Promise<void> {
    try {
      const field = this.mustFindField(fieldName);
      if (!this.localPath) throw new Error("No localPath");

      const value = typeof nextValue === "boolean" ? nextValue : !Boolean(field.value);

      this.status = "Saving checkbox…";
      this.isDirty = true;
      this.maskOverlaysForNavigation("save-checkbox");
      this.emit();

      await this.deps.fieldWriter.writeCheckbox({ localPdfPath: this.localPath, field, value });

      this.fields = this.fields.map((f) => (f.name === fieldName ? { ...f, value } : f));

      // Optional: master->child behavior is a domain rule.
      // Public repo can show the hook without publishing mappings.
      this.onCheckboxDomainRulesApplied(fieldName, value);

      await this.refreshRendererAfterSave();

      this.status = "Saved";
      this.emit();
    } catch (err) {
      this.status = "Error saving checkbox";
      this.emit();
      this.deps.onError?.(err);
      throw err;
    }
  }

  /** Save a signature (opaque payload). */
  async saveSignature(args: {
    signatureBase64: string;
    mode: "single" | "all";
    targetFieldName?: string;
  }): Promise<void> {
    try {
      if (!this.localPath) throw new Error("No localPath");

      this.status = "Saving signature…";
      this.isDirty = true;
      this.maskOverlaysForNavigation("save-signature");
      this.emit();

      await this.deps.fieldWriter.writeSignature({
        localPdfPath: this.localPath,
        signatureBase64: args.signatureBase64,
        mode: args.mode,
        targetFieldName: args.targetFieldName,
      });

      // Public repo: we avoid signature internals; optionally update values as an opaque flag.
      if (args.mode === "single" && args.targetFieldName) {
        this.fields = this.fields.map((f) =>
          f.name === args.targetFieldName ? { ...f, value: "SIGNED" } : f
        );
      } else if (args.mode === "all") {
        this.fields = this.fields.map((f) =>
          f.type === "PDFSignature" ? { ...f, value: "SIGNED" } : f
        );
      }

      await this.refreshRendererAfterSave();

      this.status = "Saved";
      this.emit();
    } catch (err) {
      this.status = "Error saving signature";
      this.emit();
      this.deps.onError?.(err);
      throw err;
    }
  }

  /** Clear all fields in the current document. */
  async clearForm(): Promise<void> {
    try {
      if (!this.localPath) throw new Error("No localPath");

      this.status = "Clearing form…";
      this.isDirty = true;
      this.maskOverlaysForNavigation("clear-form");
      this.emit();

      await this.deps.fieldWriter.clearForm({ localPdfPath: this.localPath, fields: this.fields });

      // Update local state (safe, predictable)
      this.fields = this.fields.map((f) => {
        if (f.type === "PDFCheckBox") return { ...f, value: false };
        if (f.type === "PDFTextField") return { ...f, value: "" };
        if (f.type === "PDFSignature") return { ...f, value: null };
        return { ...f, value: null };
      });

      await this.refreshRendererAfterSave();

      this.status = "Cleared";
      this.emit();
    } catch (err) {
      this.status = "Error clearing form";
      this.emit();
      this.deps.onError?.(err);
      throw err;
    }
  }

  /**
   * Close editor: in private app this warns if child forms exist or unsaved changes exist.
   * Public repo: keep the concept.
   */
  requestClose(): { okToClose: boolean; reason?: string } {
    if (this.isDirty) {
      return { okToClose: false, reason: "Unsaved changes present" };
    }
    return { okToClose: true };
  }

  // -------------------------
  // Internal helpers (safe)
  // -------------------------

  private emit() {
    this.deps.onSnapshot?.(this.getSnapshot());
  }

  private log(msg: string, extra?: Record<string, unknown>) {
    this.deps.onLog?.(msg, extra);
  }

  private mustFindField(name: string): PdfField {
    const f = this.fields.find((x) => x.name === name);
    if (!f) throw new Error(`Field not found: ${name}`);
    return f;
  }

  /**
   * Overlay rectangles depend on relativeCoordinates + viewport.
   * Geometry math lives behind CoordinateTransformPort (private implementation).
   */
  private recomputeScaledRectsIfPossible() {
    if (!this.viewport) return;

    this.fields = this.fields.map((f) => {
      if (!f.relativeCoordinates) return f;
      const scaled = this.deps.coordTransform.toPixelRect({
        rect: f.relativeCoordinates,
        viewport: {
          width: this.viewport!.width,
          height: this.viewport!.height,
          scale: this.viewport!.scale,
          rotation: this.viewport!.rotation,
        },
      });
      return { ...f, scaledCoordinates: scaled };
    });
  }

  /**
   * Layer values extracted from PDF onto template fields by name.
   * (Safe, public logic; no proprietary mapping.)
   */
  private layerValues(template: PdfField[], extracted: PdfField[]): PdfField[] {
    const map = new Map<string, PdfField>();
    extracted.forEach((f) => map.set(f.name, f));
    return template.map((t) => {
      const found = map.get(t.name);
      return found ? { ...t, value: found.value } : t;
    });
  }

  /**
   * REDACTED: template normalization rules.
   * In private app this:
   * - computes relativeCoordinates from raw coords
   * - applies cropbox/rotation adjustments
   * - applies date/time field flags, memo, etc.
   */
  private async normalizeTemplate(fields: PdfField[]): Promise<PdfField[]> {
    // In the public repo, keep this as a stub that preserves the contract.
    // You can optionally show a “shape-only” implementation with TODO markers.
    return fields;
  }

  private maskOverlaysForNavigation(reason: string) {
    this.deps.overlayGate.maskOverlays(reason);
    this.overlaysVisible = false;
  }

  private sendRendererCommand(cmd: RendererOutboundCommand) {
    if (!this.transport) return;
    const payload = this.deps.renderer.serializeCommand(cmd);
    this.transport.postMessage(payload);
  }

  /**
   * REDACTED: reads PDF bytes -> base64 then sends to renderer when READY.
   * In private app: FileSystem readAsStringAsync(localPath, { encoding: Base64 }).
   */
  private async loadIntoRenderer(): Promise<void> {
    if (!this.transport) return;
    if (!this.rendererReady) return;
    if (!this.localPath) return;

    // REDACTED: actual base64 read
    const base64 = await this.readPdfAsBase64(this.localPath);

    // Send to renderer (typed command shape)
    this.sendRendererCommand({ type: "LOAD_PDF_BASE64", base64 });
  }

  private async readPdfAsBase64(_localPath: string): Promise<string> {
    // Intentionally non-runnable.
    throw new Error("REDACTED: readPdfAsBase64(localPath) is private implementation");
  }

  /**
   * REDACTED: renderer refresh strategy after saves.
   * Private app includes stability logic (timing/page nudges/etc).
   * Public repo keeps this as a conceptual step only.
   */
  private async refreshRendererAfterSave(): Promise<void> {
    // Example conceptual behavior:
    // - mask overlays
    // - request unmask when render stabilizes
    this.deps.overlayGate.maskOverlays("refresh-after-save");
    this.overlaysVisible = false;
    this.emit();

    // REDACTED: actual refresh behavior (page bounce, timeouts, etc.)
    // Keep a minimal delay hook to show intent without revealing heuristics.
    const handle = this.deps.clock.setTimeout(() => {
      this.deps.overlayGate.requestUnmask("refresh-complete");
      this.overlaysVisible = this.deps.overlayGate.canShowOverlays();
      this.emit();
    }, 0);

    // No-op cleanup in public repo (handle kept for symmetry)
    void handle;
  }

  /**
   * Domain hook: checkbox toggles may spawn/cleanup child forms.
   * Public repo: keep the concept, but not the mapping logic.
   */
  private onCheckboxDomainRulesApplied(_fieldName: string, _value: boolean) {
    // REDACTED: master->child checkbox mapping + instance creation/cleanup
  }
}
