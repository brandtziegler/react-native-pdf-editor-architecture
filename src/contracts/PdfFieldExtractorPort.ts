// src/contracts/PdfFieldExtractorPort.ts
import type { PdfField } from "../domain/pdf/PdfField";

export type PdfFieldExtractionResult = {
  /** Fields with values as extracted from the PDF (source-of-truth). */
  extractedFields: PdfField[];

  /**
   * Optional: page metadata if your extractor can provide it.
   * Keep generic; do not publish cropbox/geometry details.
   */
  pageMeta?: Array<{
    pageIndex: number; // 0-based
    width: number;
    height: number;
    rotation?: number; // 0/90/180/270
  }>;
};

/**
 * Port for reading a local PDF and extracting form fields + current values.
 * Public repo: this is a contract only; implementation is redacted.
 */
export interface PdfFieldExtractorPort {
  extract(localPdfPath: string): Promise<PdfFieldExtractionResult>;
}
