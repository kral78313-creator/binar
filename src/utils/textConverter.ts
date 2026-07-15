import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

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

/**
 * Escapes XML special characters
 */
export function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Converts a JSON string into a beautifully formatted XML string
 */
export function jsonToXml(jsonStr: string): string {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Invalid JSON format. Cannot convert to XML.');
  }
  
  const toXml = (obj: any, rootName: string = 'root'): string => {
    if (obj === null || obj === undefined) return `<${rootName}/>`;
    if (typeof obj !== 'object') {
      return `<${rootName}>${escapeXml(String(obj))}</${rootName}>`;
    }
    
    let xml = '';
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        xml += toXml(item, rootName === 'root' ? 'item' : rootName);
      });
      return xml;
    }
    
    for (const [key, value] of Object.entries(obj)) {
      const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^[0-9]/, '_$&');
      if (Array.isArray(value)) {
        value.forEach(item => {
          xml += toXml(item, cleanKey);
        });
      } else {
        xml += toXml(value, cleanKey);
      }
    }
    return `<${rootName}>${xml}</${rootName}>`;
  };
  
  return `<?xml version="1.0" encoding="UTF-8"?>\n` + toXml(parsed);
}

/**
 * Converts XML string into a structured JSON string
 */
export function xmlToJson(xmlStr: string): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XML syntax. Please verify the source file.');
  }
  
  const nodeToJson = (node: Node): any => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue?.trim() || null;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const obj: any = {};
      
      // attributes
      if (element.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          obj['@attributes'][attr.name] = attr.value;
        }
      }
      
      // children
      const childNodes = Array.from(element.childNodes);
      const elements = childNodes.filter(n => n.nodeType === Node.ELEMENT_NODE);
      const textNodes = childNodes.filter(n => n.nodeType === Node.TEXT_NODE && n.nodeValue?.trim());
      
      if (elements.length === 0 && textNodes.length === 1) {
        const val = textNodes[0].nodeValue?.trim();
        if (element.attributes.length === 0) {
          return val;
        }
        obj['#text'] = val;
      } else if (elements.length === 0 && textNodes.length === 0) {
        return element.attributes.length === 0 ? null : obj;
      } else {
        elements.forEach(child => {
          const childEl = child as Element;
          const childName = childEl.tagName;
          const convertedChild = nodeToJson(childEl);
          
          if (obj[childName]) {
            if (!Array.isArray(obj[childName])) {
              obj[childName] = [obj[childName]];
            }
            obj[childName].push(convertedChild);
          } else {
            obj[childName] = convertedChild;
          }
        });
        
        if (textNodes.length > 0) {
          obj['#text'] = textNodes.map(n => n.nodeValue?.trim()).join(' ');
        }
      }
      return obj;
    }
    return null;
  };
  
  const rootElement = xmlDoc.documentElement;
  const result: any = {};
  result[rootElement.tagName] = nodeToJson(rootElement);
  
  return JSON.stringify(result, null, 2);
}

/**
 * Converts a SheetJS Workbook into an XML string representation
 */
export function workbookToXml(wb: XLSX.WorkBook): string {
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<spreadsheet>\n';
  data.forEach((row) => {
    xml += '  <row>\n';
    for (const [key, val] of Object.entries(row)) {
      const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^[0-9]/, '_$&');
      xml += `    <${cleanKey}>${escapeXml(String(val))}</${cleanKey}>\n`;
    }
    xml += '  </row>\n';
  });
  xml += '</spreadsheet>';
  return xml;
}

/**
 * Converts markdown text into formatted RTF (Rich Text Format)
 */
export function markdownToRtf(md: string): string {
  let rtf = '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}\n\\f0\\fs24 ';
  
  // Escape RTF special braces and slashes
  let body = md
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}');
    
  // Format headings with bold and font size sizing
  body = body.replace(/^# (.*?)$/gm, '\\b\\fs40 $1\\b0\\fs24\\par');
  body = body.replace(/^## (.*?)$/gm, '\\b\\fs32 $1\\b0\\fs24\\par');
  body = body.replace(/^### (.*?)$/gm, '\\b\\fs28 $1\\b0\\fs24\\par');
  
  // Bold formatting
  body = body.replace(/\*\*(.*?)\*\*/g, '\\b $1\\b0 ');
  
  // Italic formatting
  body = body.replace(/\*(.*?)\*/g, '\\i $1\\i0 ');
  
  // Bullet lists
  body = body.replace(/^\s*-\s+(.*?)$/gm, '•  $1\\par');
  
  // Line breaks
  body = body.replace(/\n/g, '\\par\n');
  
  rtf += body;
  rtf += '\n}';
  return rtf;
}

/**
 * Decodes RTF control sequences down to plain, unformatted text
 */
export function rtfToText(rtf: string): string {
  let text = rtf;
  
  // Remove groups with destinations (e.g. fonttbl, colortbl, generator, etc.)
  text = text.replace(/\{\\*?\\[^{}]*\}/g, '');
  
  // Remove RTF control words
  text = text.replace(/\\([a-z]{1,32})(-?\d+)? ?/g, (match, word) => {
    if (word === 'par' || word === 'line') return '\n';
    if (word === 'tab') return '\t';
    return '';
  });
  
  // Strip unmatched curly brackets
  text = text.replace(/[{}]/g, '');
  
  return text.trim();
}

/**
 * Converts HTML text into an editable Word XML-wrapped HTML file (.docx)
 */
export function convertHtmlToDocx(html: string): Blob {
  const content = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; padding: 40px; color: #1e293b; }
        h1 { color: #0f172a; font-size: 24pt; font-weight: bold; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 18pt; margin-bottom: 12pt; }
        h2 { color: #1e293b; font-size: 18pt; font-weight: bold; margin-top: 14pt; margin-bottom: 10pt; }
        h3 { color: #334155; font-size: 14pt; font-weight: bold; margin-top: 12pt; margin-bottom: 8pt; }
        p { font-size: 11pt; margin-bottom: 10pt; color: #334155; }
        ul, ol { margin-bottom: 10pt; padding-left: 20px; }
        li { font-size: 11pt; margin-bottom: 4pt; color: #334155; }
        code { font-family: 'Consolas', 'Courier New', monospace; background-color: #f1f5f9; padding: 2px 4px; font-size: 10pt; }
        pre { background-color: #f1f5f9; padding: 12px; font-family: 'Consolas', 'Courier New', monospace; font-size: 10pt; border-left: 4px solid #cbd5e1; margin-bottom: 10pt; }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
  return new Blob([content], { type: 'application/msword' });
}

/**
 * Parses DOCX file and extracts plain text
 */
export async function parseDocxText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid DOCX format: missing word/document.xml');
  }
  const docXmlText = await docXmlFile.async('text');
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXmlText, 'text/xml');
  const paragraphs = xmlDoc.getElementsByTagName('w:p');
  const textLines: string[] = [];
  
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const textRuns = p.getElementsByTagName('w:t');
    let paragraphText = '';
    for (let j = 0; j < textRuns.length; j++) {
      paragraphText += textRuns[j].textContent || '';
    }
    if (paragraphText.trim() || textRuns.length > 0) {
      textLines.push(paragraphText);
    }
  }
  return textLines.join('\n');
}

/**
 * Converts markdown/text into a PPTX-compatible Presentation HTML file
 */
export function convertTextToPptx(text: string, title: string = 'Presentation'): Blob {
  const slides: string[] = [];
  const parts = text.split(/(?=^# |^## )/gm);
  
  parts.forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    
    const lines = trimmed.split('\n');
    const heading = lines[0].replace(/^#+\s*/, '');
    const bodyLines = lines.slice(1).map(l => l.trim()).filter(Boolean);
    
    let listItems = '';
    let description = '';
    
    bodyLines.forEach((line) => {
      if (line.startsWith('-') || line.startsWith('*')) {
        listItems += `<li>${escapeXml(line.replace(/^[-*]\s*/, ''))}</li>`;
      } else {
        description += `<p>${escapeXml(line)}</p>`;
      }
    });
    
    const slideContent = `
      <div class="slide">
        <div class="header">${escapeXml(heading)}</div>
        <div class="body">
          ${description}
          ${listItems ? `<ul>${listItems}</ul>` : ''}
        </div>
      </div>
    `;
    slides.push(slideContent);
  });
  
  if (slides.length === 0) {
    slides.push(`
      <div class="slide">
        <div class="header">${escapeXml(title)}</div>
        <div class="body">
          <p>${escapeXml(text)}</p>
        </div>
      </div>
    `);
  }
  
  const presentationHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${escapeXml(title)}</title>
      <style>
        body { 
          background-color: #0b0f19; 
          color: #f1f5f9; 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; 
          padding: 0; 
          scroll-snap-type: y mandatory; 
          overflow-y: scroll;
        }
        .slide { 
          width: 100vw; 
          height: 100vh; 
          display: flex; 
          flex-direction: column; 
          justify-content: center; 
          align-items: center; 
          box-sizing: border-box; 
          padding: 60px; 
          scroll-snap-align: start; 
          page-break-after: always;
          position: relative;
          border-bottom: 2px solid #1e293b;
          background: radial-gradient(circle at center, #111827 0%, #030712 100%);
        }
        .slide::before {
          content: "";
          position: absolute;
          inset: 40px;
          border: 2px solid rgba(245, 158, 11, 0.2);
          pointer-events: none;
        }
        .header { 
          font-size: 38pt; 
          font-weight: 900; 
          color: #f59e0b; 
          margin-bottom: 30px; 
          text-align: center;
          text-transform: uppercase;
          letter-spacing: -1px;
        }
        .body { 
          font-size: 20pt; 
          color: #cbd5e1; 
          max-width: 900px; 
          line-height: 1.6;
          text-align: center;
        }
        ul { 
          list-style-type: none; 
          padding: 0; 
          margin-top: 20px;
        }
        li { 
          margin-bottom: 12px; 
          position: relative; 
          padding-left: 30px;
          text-align: left;
        }
        li::before {
          content: "✦";
          position: absolute;
          left: 0;
          color: #fbbf24;
        }
        p { margin-bottom: 15px; }
        .controls {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(15, 23, 42, 0.8);
          border: 2px border-slate-700;
          padding: 10px 15px;
          border-radius: 12px;
          font-size: 10pt;
          color: #94a3b8;
          z-index: 100;
          font-family: monospace;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
      </style>
    </head>
    <body>
      ${slides.join('')}
      <div class="controls">Scroll or Press [PgUp / PgDn] to Navigate</div>
    </body>
    </html>
  `;
  
  return new Blob([presentationHtml], { type: 'text/html;charset=utf-8' });
}

/**
 * Parses PPTX file and extracts slide content text
 */
export async function parsePptxText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const textLines: string[] = [];
  
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?. [0] || '0');
    const numB = parseInt(b.match(/\d+/)?. [0] || '0');
    return numA - numB;
  });
  
  const parser = new DOMParser();
  for (const slideName of slideFiles) {
    const slideXmlFile = zip.file(slideName);
    if (slideXmlFile) {
      const slideXmlText = await slideXmlFile.async('text');
      const xmlDoc = parser.parseFromString(slideXmlText, 'text/xml');
      const textRuns = xmlDoc.getElementsByTagName('a:t');
      const slideText: string[] = [];
      for (let i = 0; i < textRuns.length; i++) {
        const val = textRuns[i].textContent?.trim();
        if (val) slideText.push(val);
      }
      if (slideText.length > 0) {
        textLines.push(`--- SLIDE ${slideName.match(/\d+/)?. [0] || ''} ---\n` + slideText.join(' '));
      }
    }
  }
  return textLines.join('\n\n');
}

