// src/domain/pdf/PdfField.ts
import type { PercentRect, PixelRect } from "../geometry/Rect";

export type FieldValue = string | boolean | null;

export type PdfFieldType =
  | "PDFTextField"
  | "PDFSignature"
  | "PDFButton"
  | "PDFCheckBox"
  | "PDFRadio"
  | "PDFUnknown";

export type PdfFieldMetadata = {
  editable?: boolean;
  placeholder?: string;
  required?: boolean;
  /** allow extra metadata without committing to private schema */
  [k: string]: unknown;
};

export type PdfField = {
  name: string;
  type: PdfFieldType | string;

  /** Raw extracted PDF coords (x1,y1,x2,y2) in PDF space. */
  coordinates: readonly [number, number, number, number] | number[];

  /** Optional alternate rect for signature widgets. */
  signatureCoordinates?: readonly [number, number, number, number] | number[];

  /** Current value (text, checkbox state, or a signature asset/path ref). */
  value: FieldValue;

  /** 0-based page index. */
  page: number;

  /** Optional flags used by UI behavior. */
  isMemo?: boolean;
  isDate?: boolean;

  /** Normalized percent rect (rotation/cropbox logic is private). */
  relativeCoordinates?: PercentRect;

  /** Viewport-scaled rect (computed from relativeCoordinates + viewport). */
  scaledCoordinates?: PixelRect;

  metadata?: PdfFieldMetadata;
};
