# REDACTED (Intentional Omissions)

This repository (**react-native-pdf-editor-architecture**) is a **public architecture & interfaces showcase** extracted from a private production codebase.

It is intentionally **non-runnable**. The goal is to publish the *shape* of the system (contracts, DTOs, orchestration flow) while withholding proprietary implementation and customer-specific artifacts.

> This repo is meant for **code review / hiring / contract conversations**, not “npm install and run”.

---

## What is included

✅ **Architecture-level assets**
- Module boundaries and “ports/interfaces” under `src/contracts/`
- Stable DTOs/types under `src/domain/`
- Renderer message protocol under `src/application/events/`
- Orchestration/controller flow under `src/application/` (redacted stubs)

✅ **Safe placeholders**
- Screenshot/video placeholders under `docs/media/`
- Documentation stubs under `docs/`

---

## What is intentionally omitted (the “red list”)

🚫 **Renderer internals**
- WebView HTML/JS renderer implementation
- Any PDF.js wiring, injection scripts, or browser-side optimizations
- Any “timing hacks” used to stabilize rendering

🚫 **Geometry / cropbox / rotation math**
- Cropbox normalization, coordinate transforms, axis flips, rotation handling
- Any heuristics that correct PDF coordinate space vs viewport space
- Any functions similar to `adjustYWithCropBox`, `percentFromPixelsWithRotation`, etc.

🚫 **Signature internals**
- Signature image composition, scaling, anchoring, masking, clearing strategy
- Any internal signature canvas logic or serialization details

🚫 **Template normalization rules**
- Customer/template-specific field naming conventions
- Mapping rules that infer memo/date fields, required flags, or custom behavior
- Any rules that transform extracted fields into “template-normalized” overlays

🚫 **Field mapping + master/child workflows**
- Specific checkbox → child-form mapping tables
- Rules that spawn/cleanup child forms or enforce constraints

🚫 **Persistence & storage**
- File IO (reading PDF bytes, local caching paths, device folder structure)
- Database schema, SQL/EF models, or network calls
- Any auth/session wiring or tenant identifiers

🚫 **Customer data**
- PDFs, form templates, field maps, identifiers, URLs, credentials, tokens
- Any screenshots/videos that expose customer information

---

## Why this matters

The omitted items above represent **competitive differentiation** and/or **customer-confidential material**.

This repo is designed to be reviewed like a **system design / architecture artifact**.

---

## How to evaluate this repo

Look for:
- clear separation of concerns (ports)
- stable DTOs across stages (extract → normalize → overlay → persist)
- predictable orchestration flow (controller/state machine)
- renderer protocol as a defined contract (messages + commands)

---

## Private demo note

If you want to see the runnable implementation, it can be demonstrated privately
(with customer data removed and under appropriate NDA/permissions).
