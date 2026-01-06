// src/contracts/PdfFieldWriterPort.ts
import type { PdfField } from "../domain/pdf/PdfField";

export type WriteTextArgs = {
  localPdfPath: string;
  field: PdfField;
  value: string;
};

export type WriteCheckboxArgs = {
  localPdfPath: string;
  field: PdfField;
  value: boolean;
};

export type WriteSignatureArgs = {
  localPdfPath: string;

  /**
   * Base64 image data (or other opaque representation).
   * Public repo keeps this as an opaque payload; private implementation handles details.
   */
  signatureBase64: string;

  /**
   * Targeting mode:
   * - "single": write only the clicked signature field
   * - "all": write to all signature fields on the current template
   */
  mode: "single" | "all";

  /** If mode === "single", this is the target. */
  targetFieldName?: string;

  /** Optional: pre-resolved set of signature fields (if caller already filtered). */
  signatureFields?: PdfField[];
};

export type ClearFormArgs = {
  localPdfPath: string;
  /** Fields to clear (text -> empty, checkbox -> false, signature -> cleared). */
  fields: PdfField[];
};

/**
 * Port for persisting edits into the PDF.
 * Public repo: contract only. Rendering/timing/geometry/signature internals are redacted.
 */
export interface PdfFieldWriterPort {
  writeText(args: WriteTextArgs): Promise<void>;
  writeCheckbox(args: WriteCheckboxArgs): Promise<void>;

  /**
   * Signature writing is intentionally opaque here.
   * The private implementation handles placement, scaling, clearing, and any masking strategy.
   */
  writeSignature(args: WriteSignatureArgs): Promise<void>;

  /**
   * Clears all supported field types.
   * (In private code this may involve multiple passes + renderer refresh.)
   */
  clearForm(args: ClearFormArgs): Promise<void>;
}
