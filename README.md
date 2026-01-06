# Architecture & Interfaces — Mobile PDF Form Editor (React Native)

This repository is a **public architecture showcase** extracted from a private production codebase.

It is **intentionally non-runnable**.

The goal is to demonstrate:
- senior-level **module boundaries**
- clean **contracts (ports/interfaces)**
- stable **domain DTOs/types**
- a clear **render/extract/edit/persist** data-flow
- a practical **message protocol** for a WebView-based PDF renderer

✅ What you get here is the *shape* of the system: orchestration, contracts, and types.  
🚫 What you do NOT get is proprietary implementation: geometry math, renderer internals, timing hacks, signature internals, and customer-specific templates.

---

## What’s in this repo?

### `src/contracts/`
Public “ports” that define the boundaries between subsystems:
- `PdfRendererPort` — HTML shell builder + message protocol
- `PdfFieldExtractorPort` — field/value extraction
- `PdfFieldWriterPort` — persistence commands (text/checkbox/signature/clear)
- `CoordinateTransformPort` — black-box coordinate conversion
- `OverlayGatePort` — render stabilization + overlay reveal gate
- `PdfInstanceManagerPort` — open/list versioned PDF instances
- `TemplateStorePort` — per-document template mapping storage

### `src/domain/`
Stable DTOs/types:
- `PdfField` (field shape: name/type/page/value + coordinate representations)
- `PercentRect` / `PixelRect`
- document & instance identifiers

### `src/application/`
The orchestration layer (controller/state machine).  
Implementation details are redacted; only the flow and dependency directions are shown.

### `docs/`
Architecture notes and diagrams:
- module boundaries
- renderer message protocol
- redaction policy (what was removed and why)

---

## Renderer Protocol (high level)

The renderer (WebView) communicates via small JSON messages:

- `READY` — renderer is initialized and ready to receive PDF base64
- `PDF_DIMENSIONS` — provides viewport width/height/scale/rotation
- `RENDER_DONE` — page render complete (used for stabilization)
- `READY_FOR_OVERLAYS` — optional signal that overlay layer can be revealed

See: `docs/architecture/message-protocol.md`

---

## Screenshots / demo video (placeholders)

> This repo intentionally does not embed customer PDFs or private footage.

Add your own media here:

- `docs/media/screenshots/`
  - `editor-with-overlays.png`
  - `text-field-modal.png`
  - `signature-modal.png`
  - `master-child-forms.png`

- `docs/media/video/`
  - `demo.mp4`

You can reference them from this README like:

![Editor with overlays](docs/media/screenshots/editor-with-overlays.png)

---

## Why it’s non-runnable

The private system includes proprietary logic that is a competitive advantage, including:
- PDF cropbox + rotation geometry normalization
- WebView render stabilization / timing heuristics
- signature rendering/clearing internals
- template normalization rules
- internal PDF sources and field mappings

Those are intentionally replaced by **interfaces and stubs** in this public repo.

See `REDACTED.md` for the full list.

---

## License

This repository publishes only original interface/type definitions and architecture docs.
No customer PDFs, no credentials, and no production implementation are included.
