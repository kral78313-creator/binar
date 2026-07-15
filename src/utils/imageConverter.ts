import { jsPDF } from 'jspdf';

/**
 * Loads an image file into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Converts an image file to another image format or PDF
 */
export async function convertImage(
  file: File,
  targetFormat: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  onProgress?.(10);
  const objectUrl = URL.createObjectURL(file);
  onProgress?.(30);

  try {
    const img = await loadImage(objectUrl);
    onProgress?.(60);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }

    // Draw image to canvas
    ctx.drawImage(img, 0, 0);
    onProgress?.(80);

    if (targetFormat === 'pdf') {
      // Convert to PDF
      const pdf = new jsPDF({
        orientation: img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.naturalWidth, img.naturalHeight],
      });

      // Get image data from canvas
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, img.naturalWidth, img.naturalHeight);
      
      onProgress?.(95);
      const pdfBlob = pdf.output('blob');
      onProgress?.(100);
      return pdfBlob;
    }

    // Image to Image
    let mimeType = 'image/png';
    if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (targetFormat === 'webp') {
      mimeType = 'image/webp';
    } else if (targetFormat === 'gif') {
      mimeType = 'image/gif';
    } else if (targetFormat === 'bmp') {
      mimeType = 'image/bmp';
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onProgress?.(100);
            resolve(blob);
          } else {
            reject(new Error(`Failed to create blob for format ${targetFormat}`));
          }
        },
        mimeType,
        0.9 // Quality for formats that support it (JPEG/WebP)
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
