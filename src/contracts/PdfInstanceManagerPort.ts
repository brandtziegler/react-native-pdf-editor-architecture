// src/contracts/PdfInstanceManagerPort.ts
import type {
  OpenPdfInstanceRequest,
  OpenPdfInstanceResult,
  PdfInstanceInfo,
} from "../domain/pdf/PdfTypes";

/**
 * Port for managing local “instances” of PDFs:
 * - opening a working copy
 * - listing available docs/instances
 *
 * Public repo: contract only. Storage + IO details are redacted.
 */
export interface PdfInstanceManagerPort {
  open(req: OpenPdfInstanceRequest): Promise<OpenPdfInstanceResult>;

  /**
   * Lists available instances/templates for a given sheet/tag context.
   * (Shape intentionally minimal for public repo.)
   */
  list(args: { sheetId: number; tag?: string }): Promise<PdfInstanceInfo[]>;
}
