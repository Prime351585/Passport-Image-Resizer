// Grid layout for printing passport photos on a sheet of paper.
// Shared by the paper picker (photo count) and the PDF generator (drawing), so
// both always agree.

export const SHEET_MARGIN_MM = 5;
export const SHEET_SPACING_MM = 2;

export interface SheetLayout {
  cols: number;
  rows: number;
  count: number;
  /** True when the sheet fits more photos turned the other way round. */
  rotated: boolean;
  /** Sheet size in mm in the orientation actually used. */
  sheetWidthMm: number;
  sheetHeightMm: number;
}

function fit(sheetW: number, sheetH: number, photoW: number, photoH: number) {
  const usableW = sheetW - 2 * SHEET_MARGIN_MM;
  const usableH = sheetH - 2 * SHEET_MARGIN_MM;
  const cols = Math.max(0, Math.floor((usableW + SHEET_SPACING_MM) / (photoW + SHEET_SPACING_MM)));
  const rows = Math.max(0, Math.floor((usableH + SHEET_SPACING_MM) / (photoH + SHEET_SPACING_MM)));
  return { cols, rows, count: cols * rows };
}

/**
 * Best grid for the sheet. Tries the sheet as given and turned 90°, because
 * e.g. 35×45 mm photos fit 3 on a 6×4 in landscape sheet but 6 in portrait.
 */
export function sheetLayout(sheetWidthMm: number, sheetHeightMm: number, photoWidthMm: number, photoHeightMm: number): SheetLayout {
  const asGiven = fit(sheetWidthMm, sheetHeightMm, photoWidthMm, photoHeightMm);
  const turned = fit(sheetHeightMm, sheetWidthMm, photoWidthMm, photoHeightMm);
  if (turned.count > asGiven.count) {
    return { ...turned, rotated: true, sheetWidthMm: sheetHeightMm, sheetHeightMm: sheetWidthMm };
  }
  if (asGiven.count === 0) {
    // Photo larger than the sheet: still place one, centred.
    return { cols: 1, rows: 1, count: 1, rotated: false, sheetWidthMm, sheetHeightMm };
  }
  return { ...asGiven, rotated: false, sheetWidthMm, sheetHeightMm };
}

export const toMm = (value: number, unit: 'mm' | 'in') => (unit === 'mm' ? value : value * 25.4);
