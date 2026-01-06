// src/domain/pdf/PdfTypes.ts
import type { PdfField } from "./PdfField";

/**
 * Public-safe reference to a PDF template/document.
 * Keep URIs opaque; do not publish real storage paths or customer links.
 */
export type PdfDocRef = {
  fileName: string;
  fileType?: string;
  description?: string;

  /** Optional: opaque identifier for source (NOT a real URL in public repo). */
  sourceRef?: string;
};

export type PdfInstanceInfo = {
  fileName: string;
  uploadDate?: string;
  uploadedBy?: string;
  tag?: string;
};

export type OpenPdfInstanceRequest = {
  fileName: string;
  sheetId: number;
  pdfFolder: string;

  /** Optional tag/category used by instance listing logic. */
  tag?: string;
};

export type OpenPdfInstanceResult = {
  /** Local filesystem path to the working PDF copy. */
  localPath: string;

  /** Raw extracted fields from the PDF (source-of-truth values). */
  extractedFields: PdfField[];

  /**
   * Template-normalized fields (layout/relative boxes, etc.).
   * Values may be layered from extractedFields.
   */
  template: PdfField[];
};

/**
 * Template mapping store shape (your editor keeps this keyed by fileName).
 */
export type TemplateMapping = Record<string, PdfField[]>;
