import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, Image as ImageIcon, FileSpreadsheet, File } from 'lucide-react';
import { SUPPORTED_INPUTS } from '../types';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export default function DropZone({ onFilesSelected }: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      onFilesSelected(filesArray);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const filesArray = Array.from(e.target.files) as File[];
      onFilesSelected(filesArray);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Create standard accept string
  const allExtensions = Object.values(SUPPORTED_INPUTS).flat().join(',');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative group cursor-pointer border-4 rounded-[32px] p-10 md:p-14 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[340px] ${
          isDragActive
            ? "border-indigo-600 bg-indigo-50/80 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            : "border-slate-900 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
        }`}
        id="upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allExtensions}
          onChange={handleFileInput}
          className="hidden"
          id="file-input-element"
        />

        {/* Outer pulse effect when dragging */}
        {isDragActive && (
          <div className="absolute inset-0 bg-indigo-900/5 rounded-[28px] pointer-events-none animate-pulse" />
        )}

        <div className="p-4 bg-white rounded-2xl border-4 border-slate-900 flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-6 transition-transform duration-300">
          <Upload className="w-8 h-8 text-slate-900" />
        </div>

        <h3 className="mt-4 text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
          Drop your files here, or <span className="text-indigo-600 underline decoration-slate-900 decoration-3 underline-offset-4 group-hover:text-indigo-700 transition-all">browse</span>
        </h3>
        
        <p className="mt-2 text-sm text-slate-500 font-bold max-w-md mx-auto">
          Convert PDF, Excel, CSV, Images, Markdown, HTML, JSON, or TXT instantly.
        </p>

        <button className="mt-6 px-6 py-2.5 bg-white border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all">
          Browse Local Files
        </button>

        {/* Visual Badge Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 w-full max-w-xl">
          <div className="flex items-center gap-2.5 p-2.5 px-4 rounded-xl bg-blue-50 border-2 border-slate-900 text-xs text-slate-900 font-black justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span>Images</span>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 px-4 rounded-xl bg-emerald-50 border-2 border-slate-900 text-xs text-slate-900 font-black justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 px-4 rounded-xl bg-rose-50 border-2 border-slate-900 text-xs text-slate-900 font-black justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
            <FileText className="w-4 h-4 text-rose-600" />
            <span>PDF Docs</span>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 px-4 rounded-xl bg-amber-50 border-2 border-slate-900 text-xs text-slate-900 font-black justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
            <File className="w-4 h-4 text-amber-600" />
            <span>MD / JSON / TXT</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
