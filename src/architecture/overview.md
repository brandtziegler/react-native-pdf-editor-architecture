# Architecture Overview

This repository (**react-native-pdf-editor-architecture**) is a **non-runnable architecture showcase** for a WebView-based PDF form editor built in React Native.

It publishes the **contracts, DTOs, and orchestration flow** while intentionally omitting proprietary renderer internals, geometry math, signature details, and customer artifacts.

---

## High-level flow

1. **Open instance**
   - An instance manager provides a local working copy of a PDF and a template field set.

2. **Extract fields + values**
   - A field extractor returns the current PDF form fields and their values.

3. **Normalize template**
   - Template-normalized fields are produced (field list + stable identifiers + relative boxes).
   - Proprietary normalization rules (cropbox/rotation heuristics) are intentionally omitted.

4. **Render**
   - A renderer adapter produces an HTML shell and loads the PDF (base64) into a WebView-like surface.

5. **Overlay**
   - Fields are displayed as tappable overlay rectangles aligned to the rendered page.
   - Relative rects are scaled to pixel rects for hit-testing.

6. **Edit**
   - User actions produce intents (edit text, toggle checkbox, capture signature, clear form).

7. **Persist**
   - A writer port persists edits back into the local PDF, then the renderer is refreshed.

8. **Stabilize**
   - An overlay gate controls when overlays become visible (quiet-window concept) to avoid flicker/misalignment.
   - Timing heuristics are intentionally omitted.

---

## Module boundaries (ports)

- `PdfRendererPort`  
  HTML shell + message protocol + outbound commands (implementation redacted)

- `PdfFieldExtractorPort`  
  Extract fields/values from a local PDF path (implementation redacted)

- `PdfFieldWriterPort`  
  Persist edits back into the PDF (text/checkbox/signature/clear) (implementation redacted)

- `PdfInstanceManagerPort`  
  Open/list PDF instances (storage details redacted)

- `TemplateStorePort`  
  Cache/retrieve template-normalized fields by `fileName`

- `CoordinateTransformPort`  
  Convert raw coords → percent rect → pixel rect (geometry math omitted)

- `OverlayGatePort` (+ `ClockPort`)  
  Controls overlay visibility timing conceptually (heuristics omitted)

---

## Where to look in this repo

- Contracts: `src/contracts/`
- DTOs/types: `src/domain/`
- Renderer protocol: `src/application/events/`
- Orchestration: `src/application/AttachedDocEditorController.ts`

---

## Notes

This repo is meant for **code review / hiring / contract conversations**, not for running as an OSS library.

See `REDACTED.md` for the complete omissions list.
