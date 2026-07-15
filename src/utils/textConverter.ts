import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * A highly robust, lightweight Markdown to HTML converter
 */
export function markdownToHtml(md: string): string {
  let html = md;

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');

  // Bold and Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Unordered lists
  html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
  // Clean up double ul tags
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li class="ordered">$1</li>');
  html = html.replace(/(<li class="ordered">.*?<\/li>)/gs, '<ol>$1</ol>');
  html = html.replace(/<\/ol>\s*<ol>/g, '');
  html = html.replace(/class="ordered"/g, '');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Paragraphs (split by double newline, skip blocks already parsed)
  const blocks = html.split(/\n\s*\n/);
  html = blocks
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<p') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<li') ||
        trimmed.startsWith('<pre')
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}

/**
 * Simple HTML to Markdown converter
 */
export function htmlToMarkdown(html: string): string {
  let md = html;

  // Strip scripts and styles
  md = md.replace(/<script[\s\S]*?<\/script>/gi, '');
  md = md.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');

  // Bold / Italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '$1\n');
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '$1\n');

  // Links
  md = md.replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Code blocks
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Paragraphs & Line Breaks
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Strip all remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Clean double spaces and returns
  return md.trim().replace(/\n{3,}/g, '\n\n');
}

/**
 * Renders raw text or markdown structured text to an elegant PDF file
 */
export function convertTextToPdf(
  text: string,
  fileName: string,
  isMarkdown: boolean = false
): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin + 20;

  // Set initial font
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 55);

  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check page break
    if (currentY > pageHeight - margin - 20) {
      doc.addPage();
      currentY = margin;
    }

    if (!line) {
      currentY += 12; // Paragraph space
      continue;
    }

    if (isMarkdown) {
      // Elegant MD heading support
      if (line.startsWith('# ')) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(17, 24, 39);
        currentY += 10;
        doc.text(line.replace('# ', ''), margin, currentY);
        currentY += 24;
        continue;
      } else if (line.startsWith('## ')) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(31, 41, 55);
        currentY += 8;
        doc.text(line.replace('## ', ''), margin, currentY);
        currentY += 18;
        continue;
      } else if (line.startsWith('### ')) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(55, 65, 81);
        currentY += 6;
        doc.text(line.replace('### ', ''), margin, currentY);
        currentY += 16;
        continue;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        const listText = '•  ' + line.substring(2);
        const splitLines = doc.splitTextToSize(listText, contentWidth - 15);
        for (const subLine of splitLines) {
          doc.text(subLine, margin + 15, currentY);
          currentY += 14;
        }
        continue;
      }
    }

    // Standard text line
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    
    // Support bolding inline in markdown
    let cleanLine = line;
    if (isMarkdown) {
      cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
    }

    const splitText = doc.splitTextToSize(cleanLine, contentWidth);
    for (const subLine of splitText) {
      doc.text(subLine, margin, currentY);
      currentY += 14;
    }
  }

  // Footer page numbers
  const totalPages = doc.getNumberOfPages();
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 50, pageHeight - margin + 20);
    doc.text(`Document: ${fileName}`, margin, pageHeight - margin + 20);
  }

  return doc.output('blob');
}

/**
 * Converts a JSON file (expecting list of records) into CSV or Excel spreadsheet
 */
export async function convertJsonToSpreadsheet(
  file: File,
  targetFormat: 'csv' | 'xlsx'
): Promise<Blob> {
  const text = await file.text();
  let parsedData: any;
  
  try {
    parsedData = JSON.parse(text);
  } catch (err) {
    throw new Error('Invalid JSON format. Please ensure the file has a valid JSON syntax.');
  }

  // Ensure data is structured for spreadsheet conversion (either list of objects, list of arrays, or single object)
  let sheetData: any[] = [];
  if (Array.isArray(parsedData)) {
    sheetData = parsedData;
  } else if (typeof parsedData === 'object' && parsedData !== null) {
    // If it's a single object, convert it to a key-value list
    sheetData = Object.entries(parsedData).map(([key, value]) => ({
      Key: key,
      Value: typeof value === 'object' ? JSON.stringify(value) : value
    }));
  } else {
    throw new Error('JSON structure must be an array of items or a key-value object.');
  }

  const ws = XLSX.utils.json_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'JSON Export');

  if (targetFormat === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  } else {
    const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}
