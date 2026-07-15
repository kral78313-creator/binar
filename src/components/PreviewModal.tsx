import React from 'react';
import { motion } from 'motion/react';
import { X, Download, FileText, FileSpreadsheet, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { FileItem, FORMAT_LABELS } from '../types';
import { formatBytes } from './FileItemRow';

interface PreviewModalProps {
  item: FileItem;
  onClose: () => void;
}

export default function PreviewModal({ item, onClose }: PreviewModalProps) {
  const result = item.convertedResult;
  if (!result) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(result.extension);
  const isPdf = result.extension === 'pdf';
  const isTxt = result.extension === 'txt';
  const isMd = result.extension === 'md';
  const isJson = result.extension === 'json';
  const isHtml = result.extension === 'html';

  // Determine what icon to show in modal header
  const getHeaderIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (isPdf) return <FileText className="w-5 h-5 text-red-500" />;
    if (['csv', 'xlsx', 'xls'].includes(result.extension)) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    return <FileText className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      id="preview-modal-backdrop"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden border-4 border-slate-900"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b-4 border-slate-900 flex-shrink-0 bg-amber-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-white rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {getHeaderIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 truncate max-w-sm sm:max-w-md md:max-w-lg" title={result.name}>
                {result.name}
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {FORMAT_LABELS[result.extension] || result.extension.toUpperCase()} • {formatBytes(result.size)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Direct Open in New Tab for PDF/Images */}
            {(isPdf || isImage) && (
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-700 hover:text-slate-900 bg-white border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Download Link */}
            <a
              href={result.url}
              download={result.name}
              className="flex items-center gap-1.5 p-2 px-3.5 text-xs font-black text-slate-900 bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline uppercase">Download</span>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-700 hover:text-slate-900 bg-rose-200 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content Preview Panel */}
        <div className="flex-1 bg-[#FFFBEB]/30 overflow-auto p-6 flex items-center justify-center relative">
          {/* 1. Multi-file layout (e.g., PDF pages converted to multiple PNGs) */}
          {result.multipleFiles && result.multipleFiles.length > 0 ? (
            <div className="w-full h-full flex flex-col gap-6">
              <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Converted Pages ({result.multipleFiles.length} files)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-4">
                {result.multipleFiles.map((page, index) => (
                  <div key={index} className="bg-white p-4 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group">
                    <div className="aspect-[3/4] bg-amber-50/50 rounded-xl border-2 border-slate-900 overflow-hidden relative flex items-center justify-center">
                      <img
                        src={page.url}
                        alt={page.name}
                        className="max-h-full max-w-full object-contain p-2"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white border-2 border-slate-900 rounded-xl text-slate-900 hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:scale-95"
                          title="Open full size"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <a
                          href={page.url}
                          download={page.name}
                          className="p-2 bg-emerald-400 border-2 border-slate-900 text-slate-900 rounded-xl hover:bg-emerald-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:scale-95"
                          title="Download page"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between min-w-0">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{page.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">{formatBytes(page.size)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* 2. Image Renderer */}
              {isImage && (
                <div className="max-w-full max-h-full flex items-center justify-center bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <img
                    src={result.url}
                    alt={result.name}
                    className="max-h-[60vh] max-w-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* 3. PDF embed iframe (Native system browser viewer) */}
              {isPdf && (
                <iframe
                  src={result.url}
                  className="w-full h-full bg-white rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  title="PDF Preview"
                />
              )}

              {/* 4. Spreadsheet HTML View (rendered from xlsx to html) */}
              {(result.extension === 'html' && result.previewContent) && (
                <div className="w-full h-full bg-white rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-auto p-4">
                  <div 
                    dangerouslySetInnerHTML={{ __html: result.previewContent }} 
                    className="w-full spreadsheet-preview-table prose prose-sm max-w-none"
                  />
                </div>
              )}

              {/* 5. Markdown compiled View */}
              {isMd && result.previewContent && (
                <div className="w-full max-w-3xl h-full bg-white rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-auto p-8 sm:p-12">
                  <div 
                    dangerouslySetInnerHTML={{ __html: result.previewContent }} 
                    className="prose prose-slate max-w-none text-slate-900 space-y-4 font-semibold"
                  />
                </div>
              )}

              {/* 6. Text / JSON Data Renderer */}
              {(isTxt || isJson) && result.previewContent && (
                <div className="w-full h-full bg-slate-900 rounded-2xl border-4 border-slate-900 shadow-inner p-6 overflow-auto font-mono text-xs text-amber-100 leading-relaxed">
                  <pre className="whitespace-pre-wrap word-break">{result.previewContent}</pre>
                </div>
              )}

              {/* 7. HTML code renderer or generic fallback */}
              {isHtml && !result.previewContent && (
                <iframe
                  src={result.url}
                  className="w-full h-full bg-white rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  title="HTML Preview"
                />
              )}
              
              {/* Simple fallback */}
              {!isImage && !isPdf && !isTxt && !isMd && !isJson && !isHtml && (
                <div className="text-center p-8 bg-white rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-base font-black text-slate-900">Preview Not Available</h4>
                  <p className="text-xs text-slate-500 font-bold mt-2">
                    Direct visual preview is not supported for this format. Please download the file to view its full contents.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
