import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  File, FileText, FileSpreadsheet, Image as ImageIcon, 
  Trash2, Play, CheckCircle2, AlertCircle, Download, Eye, RefreshCw 
} from 'lucide-react';
import { FileItem, CONVERSION_MAP, FORMAT_LABELS } from '../types';

interface FileItemRowProps {
  key?: string;
  item: FileItem;
  onUpdateTargetFormat: (id: string, format: string) => void;
  onUpdateTargetLanguage: (id: string, language: string) => void;
  onStartConversion: (id: string) => void | Promise<void>;
  onRemove: (id: string) => void;
  onPreview: (item: FileItem) => void | any;
}

// Helper to check if file content language translation can be applied
function isTranslatable(targetFormat: string | undefined, srcExt: string): boolean {
  if (!targetFormat) return false;
  const translatableFormats = ['txt', 'md', 'html', 'json', 'csv', 'xlsx', 'xls', 'pdf'];
  return translatableFormats.includes(srcExt.toLowerCase()) && translatableFormats.includes(targetFormat.toLowerCase());
}

// Helper to format file sizes
export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper to get appropriate icon for file extension
export function getFileIcon(ext: string) {
  const e = ext.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(e)) {
    return <ImageIcon className="w-6 h-6 text-blue-500" />;
  }
  if (e === 'pdf') {
    return <FileText className="w-6 h-6 text-red-500" />;
  }
  if (['xlsx', 'xls', 'csv'].includes(e)) {
    return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
  }
  return <File className="w-6 h-6 text-amber-500" />;
}

export default function FileItemRow({
  item,
  onUpdateTargetFormat,
  onUpdateTargetLanguage,
  onStartConversion,
  onRemove,
  onPreview
}: FileItemRowProps) {
  const extension = item.extension.toLowerCase();
  const availableFormats = CONVERSION_MAP[extension] || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative p-5 bg-white border-4 border-slate-900 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}
      id={`file-row-${item.id}`}
    >
      {/* File Info */}
      <div className="flex items-start gap-4 min-w-0 md:max-w-[38%] flex-1">
        <div className="p-3 bg-white border-2 border-slate-900 rounded-xl flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {getFileIcon(extension)}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-black text-slate-900 truncate" title={item.name}>
            {item.name}
          </h4>
          <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
            {formatBytes(item.size)} • {item.extension}
          </p>
        </div>
      </div>

      {/* Conversion Actions & States */}
      <div className="flex flex-wrap items-center gap-3.5 flex-shrink-0 md:flex-grow justify-start md:justify-end">
        {/* Step 1: Selector (Visible when Idle or Completed) */}
        {item.status === 'idle' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wide">To:</span>
              <select
                value={item.targetFormat || ''}
                onChange={(e) => onUpdateTargetFormat(item.id, e.target.value)}
                className="text-xs font-black text-slate-900 bg-amber-100 hover:bg-amber-200 border-2 border-slate-900 rounded-xl p-2 px-3 pr-8 focus:outline-none focus:bg-amber-200 cursor-pointer min-w-[100px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] appearance-none relative"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '12px'
                }}
              >
                <option value="" disabled>SELECT</option>
                {availableFormats.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Translation Selector */}
            {isTranslatable(item.targetFormat, extension) && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-600 uppercase tracking-wide">Language:</span>
                <select
                  value={item.targetLanguage || ''}
                  onChange={(e) => onUpdateTargetLanguage(item.id, e.target.value)}
                  className="text-xs font-black text-slate-900 bg-indigo-100 hover:bg-indigo-200 border-2 border-slate-900 rounded-xl p-2 px-3 pr-8 focus:outline-none focus:bg-indigo-200 cursor-pointer min-w-[130px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] appearance-none relative"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '12px'
                  }}
                >
                  <option value="">Original Language</option>
                  <option value="Turkish">🇹🇷 Turkish (Türkçe)</option>
                  <option value="English">🇬🇧 English</option>
                  <option value="Spanish">🇪🇸 Spanish (Español)</option>
                  <option value="French">🇫🇷 French (Français)</option>
                  <option value="German">🇩🇪 German (Deutsch)</option>
                  <option value="Japanese">🇯🇵 Japanese (日本語)</option>
                  <option value="Italian">🇮🇹 Italian (Italiano)</option>
                  <option value="Portuguese">🇵🇹 Portuguese (Português)</option>
                  <option value="Chinese">🇨🇳 Chinese (中文)</option>
                  <option value="Arabic">🇸🇦 Arabic (العربية)</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Status badges or Action buttons */}
        <div className="flex items-center gap-2">
          {item.status === 'idle' && (
            <button
              onClick={() => onStartConversion(item.id)}
              disabled={!item.targetFormat}
              className={`flex items-center gap-1.5 p-2.5 px-4 text-xs font-black rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${
                item.targetFormat
                  ? 'bg-rose-400 text-slate-900 hover:bg-rose-300 hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border-slate-300 shadow-none cursor-not-allowed'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>CONVERT</span>
            </button>
          )}

          {item.status === 'converting' && (
            <div className="flex items-center gap-2.5 text-xs font-black text-slate-900 bg-amber-200 border-2 border-slate-900 p-2.5 px-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-900" />
              <span>CONVERTING {item.progress}%</span>
            </div>
          )}

          {item.status === 'completed' && item.convertedResult && (
            <div className="flex items-center gap-2">
              {/* Target Indicator badge */}
              <span className="text-xs font-black text-slate-900 bg-emerald-300 border-2 border-slate-900 p-1.5 px-3 rounded-full uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {item.convertedResult.extension}
              </span>
              
              {/* Preview Button */}
              <button
                onClick={() => onPreview(item)}
                className="flex items-center gap-1.5 p-2 px-3 text-xs font-black text-slate-950 bg-indigo-200 hover:bg-indigo-100 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>PREVIEW</span>
              </button>

              {/* Download Button */}
              <a
                href={item.convertedResult.url}
                download={item.convertedResult.name}
                className="flex items-center gap-1.5 p-2 px-3.5 text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD</span>
              </a>
            </div>
          )}

          {item.status === 'failed' && (
            <div className="flex items-center gap-2 text-xs font-black text-rose-700 bg-rose-50 border-2 border-slate-900 p-2.5 px-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-xs md:max-w-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span className="truncate" title={item.error}>{item.error || 'Conversion failed'}</span>
              <button
                onClick={() => onStartConversion(item.id)}
                className="ml-2 underline text-indigo-700 hover:text-indigo-900 text-xs font-black"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Delete action */}
        {item.status !== 'converting' && (
          <button
            onClick={() => onRemove(item.id)}
            className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-50 border-2 border-transparent hover:border-slate-900 rounded-xl transition-all cursor-pointer"
            title="Remove from queue"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Bar (overlays the bottom when converting) */}
      <AnimatePresence>
        {item.status === 'converting' && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            className="absolute bottom-0 left-0 right-0 h-2 bg-slate-100 rounded-b-xl overflow-hidden"
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 0.1 }}
              className="h-full bg-indigo-600"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
