import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

/**
 * Parses any spreadsheet file (xlsx, xls, csv) into a SheetJS Workbook
 */
export async function parseSpreadsheet(file: File): Promise<XLSX.WorkBook> {
  const data = await file.arrayBuffer();
  return XLSX.read(data, { type: 'array' });
}

/**
 * Converts spreadsheet to CSV
 */
export async function convertSpreadsheetToCsv(file: File): Promise<Blob> {
  const wb = await parseSpreadsheet(file);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(ws);
  return new Blob([csv], { type: 'text/csv;charset=utf-8' });
}

/**
 * Converts spreadsheet to JSON
 */
export async function convertSpreadsheetToJson(file: File): Promise<Blob> {
  const wb = await parseSpreadsheet(file);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(ws);
  const jsonString = JSON.stringify(jsonData, null, 2);
  return new Blob([jsonString], { type: 'application/json;charset=utf-8' });
}

/**
 * Converts spreadsheet to HTML string
 */
export async function convertSpreadsheetToHtmlString(file: File): Promise<string> {
  const wb = await parseSpreadsheet(file);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_html(ws);
}

/**
 * Converts spreadsheet to HTML Blob
 */
export async function convertSpreadsheetToHtml(file: File): Promise<Blob> {
  const htmlContent = await convertSpreadsheetToHtmlString(file);
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
  table { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 14px; }
  th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
  th { background-color: #f5f5f7; font-weight: 600; color: #1d1d1f; }
  tr:nth-child(even) { background-color: #fafafa; }
  tr:hover { background-color: #f0f0f2; }
</style>
</head>
<body>
  <h2>Spreadsheet Export: ${file.name}</h2>
  ${htmlContent}
</body>
</html>`;
  return new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
}

/**
 * Converts CSV to XLSX (Excel)
 */
export async function convertCsvToXlsx(file: File): Promise<Blob> {
  const text = await file.text();
  const ws = XLSX.utils.aoa_to_sheet(
    text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet 1');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Formats data cells to render cleanly in jsPDF
 */
export async function convertSpreadsheetToPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  onProgress?.(10);
  const wb = await parseSpreadsheet(file);
  onProgress?.(30);

  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  // Read spreadsheet data as raw Array of Arrays
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
  onProgress?.(50);

  // Initialize jsPDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  
  // Title Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`Spreadsheet: ${file.name}`, margin, margin);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, margin + 15);
  
  let currentY = margin + 40;
  const colWidth = (pageWidth - margin * 2) / Math.max(...data.map(row => row.length), 5);
  const rowHeight = 22;

  // Let's render the headers & rows
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - margin) {
      doc.addPage('landscape');
      currentY = margin + 20;
    }

    const isHeader = rowIndex === 0;

    // Draw row background for header
    if (isHeader) {
      doc.setFillColor(240, 240, 243);
      doc.rect(margin, currentY, pageWidth - margin * 2, rowHeight, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(30, 30, 35);
    } else {
      // Alternating rows
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, currentY, pageWidth - margin * 2, rowHeight, 'F');
      }
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60, 60, 65);
    }

    // Render cells
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellVal = row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : '';
      const cellX = margin + colIndex * colWidth;
      
      // Draw grid line borders
      doc.setDrawColor(220, 220, 225);
      doc.setLineWidth(0.5);
      doc.rect(cellX, currentY, colWidth, rowHeight, 'S');

      // Clip/Truncate cell text to avoid overlapping next cells
      const textX = cellX + 6;
      const textY = currentY + 14;
      const truncatedText = doc.splitTextToSize(cellVal, colWidth - 10)[0] || '';
      doc.text(truncatedText, textX, textY);
    }

    currentY += rowHeight;
    const progress = 50 + Math.floor((rowIndex / data.length) * 45);
    onProgress?.(progress);
  }

  onProgress?.(100);
  return doc.output('blob');
}
