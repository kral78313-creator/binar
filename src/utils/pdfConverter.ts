import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker source dynamically based on the package version
const pdfjsVersion = pdfjsLib.version || '4.0.379';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

/**
 * Converts a PDF file into individual images (one per page)
 */
export async function convertPdfToImages(
  file: File,
  targetFormat: 'png' | 'jpg',
  onProgress?: (progress: number) => void
): Promise<{ name: string; url: string; blob: Blob; size: number }[]> {
  onProgress?.(5);
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(20);

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const results: { name: string; url: string; blob: Blob; size: number }[] = [];

  const baseName = file.name.replace(/\.[^/.]+$/, "");

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    
    // Use scale 2.0 for higher quality image conversion
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error(`Failed to create 2D canvas context for page ${pageNum}`);
    }

    await page.render({
      canvasContext: context,
      viewport: viewport
    } as any).promise;

    const mimeType = targetFormat === 'png' ? 'image/png' : 'image/jpeg';
    const ext = targetFormat === 'png' ? 'png' : 'jpg';

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error(`Failed to render page ${pageNum} to blob`));
      }, mimeType, 0.95);
    });

    results.push({
      name: `${baseName}_page_${pageNum}.${ext}`,
      url: URL.createObjectURL(blob),
      blob,
      size: blob.size
    });

    const progressValue = 20 + Math.floor((pageNum / numPages) * 80);
    onProgress?.(progressValue);
  }

  return results;
}

/**
 * Extracts plain text from a PDF file
 */
export async function convertPdfToText(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  onProgress?.(10);
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(30);

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Reconstruct lines based on items
    const pageLines: string[] = [];
    let currentY: number | null = null;
    let currentLine: string[] = [];

    for (const item of textContent.items as any[]) {
      const str = item.str || '';
      // item.transform contains [scaleX, skewY, skewX, scaleY, translateX, translateY]
      const y = item.transform ? item.transform[5] : null;

      if (currentY !== null && Math.abs(y - currentY) > 5) {
        // New line detected
        pageLines.push(currentLine.join(' '));
        currentLine = [];
      }
      
      if (str.trim()) {
        currentLine.push(str);
        currentY = y;
      }
    }
    
    if (currentLine.length > 0) {
      pageLines.push(currentLine.join(' '));
    }

    fullText += `--- PAGE ${pageNum} ---\n\n`;
    fullText += pageLines.join('\n') + '\n\n';

    const progressValue = 30 + Math.floor((pageNum / numPages) * 70);
    onProgress?.(progressValue);
  }

  return new Blob([fullText], { type: 'text/plain;charset=utf-8' });
}
