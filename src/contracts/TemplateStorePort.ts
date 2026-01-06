// src/contracts/TemplateStorePort.ts
import type { PdfField } from "../domain/pdf/PdfField";

/**
 * Stores per-document “template-normalized” field definitions.
 * In your editor this is effectively: templateMapping[fileName] = PdfField[].
 *
 * Public repo: contract only. Persistence (memory, disk, DB) is redacted.
 */
export interface TemplateStorePort {
  getTemplate(fileName: string): PdfField[] | null;
  putTemplate(fileName: string, template: PdfField[]): void;

  /**
   * Optional helper for housekeeping.
   * Keep it in the contract because your editor sometimes clears template data.
   */
  clearTemplate(fileName: string): void;
}
