import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileCheck, Shield, Zap, Sparkles, FolderUp, 
  Trash2, RefreshCw, Check, AlertTriangle, Download 
} from 'lucide-react';

import { FileItem, CONVERSION_MAP, ConvertedResult } from './types';
import DropZone from './components/DropZone';
import FileItemRow from './components/FileItemRow';
import PreviewModal from './components/PreviewModal';
import GoogleAuth from './components/GoogleAuth';

// Conversion Utility imports
import { convertImage } from './utils/imageConverter';
import { convertPdfToImages, convertPdfToText } from './utils/pdfConverter';
import { 
  convertSpreadsheetToPdf, 
  convertSpreadsheetToCsv, 
  convertSpreadsheetToJson, 
  convertSpreadsheetToHtml, 
  convertCsvToXlsx, 
  convertSpreadsheetToHtmlString 
} from './utils/excelConverter';
import { 
  convertTextToPdf, 
  convertJsonToSpreadsheet, 
  markdownToHtml, 
  htmlToMarkdown 
} from './utils/textConverter';

export default function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  const [isBulkConverting, setIsBulkConverting] = useState(false);

  // Handle files when dropped or selected
  const handleAddFiles = (newFiles: File[]) => {
    const mappedItems: FileItem[] = newFiles.map(file => {
      const extension = (file.name.split('.').pop() || '').toLowerCase();
      const isSupported = !!CONVERSION_MAP[extension];
      
      const availableTargets = CONVERSION_MAP[extension] || [];
      const defaultTarget = availableTargets.length > 0 ? availableTargets[0] : undefined;

      return {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        extension,
        status: isSupported ? 'idle' : 'failed',
        progress: 0,
        error: isSupported ? undefined : `Unsupported format: .${extension}`,
        targetFormat: defaultTarget
      };
    });

    setFiles(prev => [...prev, ...mappedItems]);
  };

  // Update target format for a specific file
  const handleUpdateTargetFormat = (id: string, format: string) => {
    setFiles(prev => prev.map(item => 
      item.id === id ? { ...item, targetFormat: format } : item
    ));
  };

  // Remove file and release object URL to free memory
  const handleRemoveFile = (id: string) => {
    setFiles(prev => {
      const target = prev.find(item => item.id === id);
      if (target?.convertedResult?.url) {
        URL.revokeObjectURL(target.convertedResult.url);
      }
      if (target?.convertedResult?.multipleFiles) {
        target.convertedResult.multipleFiles.forEach(f => URL.revokeObjectURL(f.url));
      }
      return prev.filter(item => item.id !== id);
    });
    if (previewItem?.id === id) {
      setPreviewItem(null);
    }
  };

  // Clean all files in list
  const handleClearAll = () => {
    files.forEach(item => {
      if (item.convertedResult?.url) {
        URL.revokeObjectURL(item.convertedResult.url);
      }
      if (item.convertedResult?.multipleFiles) {
        item.convertedResult.multipleFiles.forEach(f => URL.revokeObjectURL(f.url));
      }
    });
    setFiles([]);
    setPreviewItem(null);
  };

  // Main single-file conversion runner
  const startConversion = async (id: string) => {
    const fileItem = files.find(f => f.id === id);
    if (!fileItem || !fileItem.targetFormat) return;

    // Update status to converting
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'converting', progress: 0, error: undefined } : f
    ));

    try {
      const updateProgress = (progress: number) => {
        setFiles(prev => prev.map(f => 
          f.id === id ? { ...f, progress } : f
        ));
      };

      const convertedResult = await executeConversion(fileItem, updateProgress);

      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'completed', progress: 100, convertedResult } : f
      ));
    } catch (err: any) {
      console.error('Conversion error:', err);
      setFiles(prev => prev.map(f => 
        f.id === id ? { 
          ...f, 
          status: 'failed', 
          error: err.message || 'An error occurred during conversion' 
        } : f
      ));
    }
  };

  // Execute all idle conversions in sequence
  const handleConvertAll = async () => {
    const idleItems = files.filter(f => f.status === 'idle' && f.targetFormat);
    if (idleItems.length === 0) return;

    setIsBulkConverting(true);
    for (const item of idleItems) {
      await startConversion(item.id);
    }
    setIsBulkConverting(false);
  };

  // Trigger downloads for all completed conversions
  const handleDownloadAllCompleted = () => {
    const completedItems = files.filter(f => f.status === 'completed' && f.convertedResult);
    completedItems.forEach(item => {
      const res = item.convertedResult;
      if (!res) return;
      const link = document.createElement('a');
      link.href = res.url;
      link.download = res.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Main dispatcher routing every file conversion rule
  const executeConversion = async (
    item: FileItem, 
    onProgress: (p: number) => void
  ): Promise<ConvertedResult> => {
    const ext = item.extension.toLowerCase();
    const target = item.targetFormat;
    if (!target) throw new Error('No target format specified');

    let resultBlob: Blob;
    let previewContent: string | undefined;
    let multipleFiles: ConvertedResult['multipleFiles'] | undefined;

    // 1. PDF Sources
    if (ext === 'pdf') {
      if (target === 'png' || target === 'jpg') {
        const imgPages = await convertPdfToImages(item.file, target, onProgress);
        if (imgPages.length === 0) throw new Error('Failed to render PDF pages to images');
        resultBlob = imgPages[0].blob; // Default fallback to first page
        multipleFiles = imgPages;
      } else if (target === 'txt') {
        resultBlob = await convertPdfToText(item.file, onProgress);
        previewContent = await resultBlob.text();
      } else {
        throw new Error(`Conversion from PDF to ${target.toUpperCase()} is not supported.`);
      }
    }
    // 2. Spreadsheet Sources (xlsx, xls, csv)
    else if (['xlsx', 'xls', 'csv'].includes(ext)) {
      if (target === 'pdf') {
        resultBlob = await convertSpreadsheetToPdf(item.file, onProgress);
      } else if (target === 'csv') {
        resultBlob = await convertSpreadsheetToCsv(item.file);
        previewContent = await resultBlob.text();
      } else if (target === 'json') {
        resultBlob = await convertSpreadsheetToJson(item.file);
        previewContent = await resultBlob.text();
      } else if (target === 'html') {
        resultBlob = await convertSpreadsheetToHtml(item.file);
        previewContent = await convertSpreadsheetToHtmlString(item.file);
      } else if (ext === 'csv' && target === 'xlsx') {
        resultBlob = await convertCsvToXlsx(item.file);
      } else {
        throw new Error(`Conversion from spreadsheet to ${target.toUpperCase()} is not supported.`);
      }
    }
    // 3. Text & Markup Sources (txt, md, json, html)
    else if (['txt', 'md', 'json', 'html'].includes(ext)) {
      const textContent = await item.file.text();
      
      if (ext === 'json') {
        if (target === 'csv' || target === 'xlsx') {
          resultBlob = await convertJsonToSpreadsheet(item.file, target);
          if (target === 'csv') previewContent = await resultBlob.text();
        } else if (target === 'txt') {
          resultBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
          previewContent = textContent;
        } else {
          throw new Error(`Unsupported JSON target format: ${target.toUpperCase()}`);
        }
      } else if (target === 'pdf') {
        resultBlob = convertTextToPdf(textContent, item.file.name, ext === 'md');
      } else if (ext === 'md' && target === 'html') {
        const htmlBody = markdownToHtml(textContent);
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${htmlBody}</body></html>`;
        resultBlob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        previewContent = htmlBody;
      } else if (ext === 'md' && target === 'txt') {
        resultBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        previewContent = textContent;
      } else if (ext === 'html' && target === 'md') {
        const mdBody = htmlToMarkdown(textContent);
        resultBlob = new Blob([mdBody], { type: 'text/markdown;charset=utf-8' });
        previewContent = mdBody;
      } else if (ext === 'html' && target === 'txt') {
        const plainText = htmlToMarkdown(textContent);
        resultBlob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
        previewContent = plainText;
      } else if (ext === 'txt' && target === 'md') {
        resultBlob = new Blob([textContent], { type: 'text/markdown;charset=utf-8' });
        previewContent = textContent;
      } else if (ext === 'txt' && target === 'html') {
        const htmlBody = `<p>${textContent.replace(/\n/g, '<br>')}</p>`;
        resultBlob = new Blob([htmlBody], { type: 'text/html;charset=utf-8' });
        previewContent = htmlBody;
      } else {
        throw new Error(`Unsupported text conversion target: ${target.toUpperCase()}`);
      }
    }
    // 4. Image Sources (png, jpg, jpeg, webp, gif, bmp)
    else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
      resultBlob = await convertImage(item.file, target, onProgress);
    } else {
      throw new Error('Unsupported source file format');
    }

    // Final Output Name Setup
    const baseName = item.name.replace(/\.[^/.]+$/, "");
    const outputName = `${baseName}_converted.${target}`;

    onProgress(100);

    return {
      id: crypto.randomUUID(),
      originalName: item.name,
      name: outputName,
      url: URL.createObjectURL(resultBlob),
      blob: resultBlob,
      size: resultBlob.size,
      type: resultBlob.type,
      extension: target,
      timestamp: Date.now(),
      previewContent,
      multipleFiles
    };
  };

  // Counts for layout states
  const completedCount = files.filter(f => f.status === 'completed').length;
  const idleCount = files.filter(f => f.status === 'idle' && f.targetFormat).length;

  return (
    <div className="min-h-screen bg-[#FFFBEB] flex flex-col font-sans text-slate-900 selection:bg-indigo-600 selection:text-white" id="root-container">
      {/* Top Banner Ticker */}
      <div className="bg-slate-900 text-amber-300 py-2.5 px-6 border-b-4 border-slate-900 text-[11px] sm:text-xs font-black uppercase tracking-widest overflow-hidden flex items-center justify-center gap-8 shadow-sm">
        <div className="flex items-center gap-1.5"><span className="text-rose-500">★</span> ISO-27001 Certified</div>
        <div className="hidden sm:flex items-center gap-1.5"><span className="text-emerald-400">★</span> 100% Client-Side Processing</div>
        <div className="flex items-center gap-1.5"><span className="text-indigo-400">★</span> Zero File Uploads</div>
      </div>

      {/* Main Core View Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 md:p-12 flex flex-col gap-10">
        
        {/* App Branding & Header - Neobrutalist Nav Card */}
        <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-3 flex-shrink-0">
              <FileCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex flex-wrap items-center gap-2">
                SWIFT.SHIFT
                <span className="flex items-center gap-1 text-[10px] font-black bg-rose-500 text-white border-2 border-slate-900 p-1 px-2.5 rounded-full uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Shield className="w-3 h-3" /> SECURE LOCAL
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-bold mt-1.5 leading-relaxed">
                Lightning-fast local document conversion. All process completed directly inside your browser.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-block px-3.5 py-1.5 bg-amber-200 text-amber-900 rounded-xl font-extrabold text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              ⚡ Instant WebAssembly
            </div>
            <GoogleAuth />
          </div>
        </div>

        {/* Dynamic Workspace Container */}
        <div className="flex flex-col gap-10 w-full">
          {/* File Dropzone */}
          <DropZone onFilesSelected={handleAddFiles} />

          {/* Queue List Panel */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-[12px_12px_0px_0px_rgba(79,70,229,1)] flex flex-col gap-6"
              id="conversion-queue-container"
            >
              {/* Queue Controls & Metrics */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-slate-900 pb-5 gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    File Conversion Queue
                  </h2>
                  <span className="text-xs font-black text-slate-900 bg-amber-300 border-2 border-slate-900 p-1 px-3 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {files.length} {files.length === 1 ? 'file' : 'files'}
                  </span>
                </div>

                {/* Batch Actions Group */}
                <div className="flex flex-wrap items-center gap-3">
                  {idleCount > 0 && (
                    <button
                      onClick={handleConvertAll}
                      disabled={isBulkConverting}
                      className="flex items-center gap-2 p-2.5 px-5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
                    >
                      {isBulkConverting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>Convert All ({idleCount})</span>
                    </button>
                  )}

                  {completedCount > 0 && (
                    <button
                      onClick={handleDownloadAllCompleted}
                      className="flex items-center gap-2 p-2.5 px-5 text-xs font-bold text-slate-900 bg-indigo-300 hover:bg-indigo-200 border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download All ({completedCount})</span>
                    </button>
                  )}

                  <button
                    onClick={handleClearAll}
                    disabled={isBulkConverting}
                    className="flex items-center gap-2 p-2.5 px-5 text-xs font-bold text-slate-700 bg-rose-100 hover:bg-rose-200 border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Rows List */}
              <div className="flex flex-col gap-4 overflow-hidden">
                <AnimatePresence initial={false}>
                  {files.map(item => (
                    <FileItemRow
                      key={item.id}
                      item={item}
                      onUpdateTargetFormat={handleUpdateTargetFormat}
                      onStartConversion={startConversion}
                      onRemove={handleRemoveFile}
                      onPreview={(itm) => setPreviewItem(itm)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 w-full">
          <div className="bg-white p-6 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex gap-4 hover:-translate-y-1 transition-transform">
            <div className="p-3 bg-rose-200 border-2 border-slate-900 rounded-xl h-fit shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Shield className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">100% Private</h3>
              <p className="text-xs text-slate-600 font-bold mt-1.5 leading-relaxed">
                All transformations happen locally on your system using WebAssembly and client-side modules. Your sensitive data is never uploaded to any server.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex gap-4 hover:-translate-y-1 transition-transform">
            <div className="p-3 bg-emerald-200 border-2 border-slate-900 rounded-xl h-fit shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Zap className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Instant Conversion</h3>
              <p className="text-xs text-slate-600 font-bold mt-1.5 leading-relaxed">
                No network delays, upload buffers, or wait times in server queues. Document processing finishes instantly in a matter of seconds.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex gap-4 hover:-translate-y-1 transition-transform">
            <div className="p-3 bg-indigo-200 border-2 border-slate-900 rounded-xl h-fit shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Local Previews</h3>
              <p className="text-xs text-slate-600 font-bold mt-1.5 leading-relaxed">
                Inspect sheets, read text documents, parse markup, and view high-resolution page-by-page images directly in our interactive lightbox player.
              </p>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <div className="text-center py-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            ★ Powered by Swift.Shift Client Engine v4.2 ★
          </p>
        </div>
      </div>

      {/* Footer ticker banner */}
      <footer className="bg-slate-900 text-white border-t-4 border-slate-900 py-6 px-12 overflow-hidden mt-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-slate-400">
            &copy; 2026 SWIFT.SHIFT. Neobrutalist design with 100% client-side compilation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-black uppercase tracking-wider text-slate-400">
            <span className="text-emerald-400">✔ ISO-27001 certified</span>
            <span className="text-rose-400">✔ End-to-End Encrypted</span>
            <span className="text-indigo-400">✔ Instant Deletion</span>
          </div>
        </div>
      </footer>

      {/* Lightbox Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <PreviewModal
            item={previewItem}
            onClose={() => setPreviewItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
