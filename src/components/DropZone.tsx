import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, Image as ImageIcon, FileSpreadsheet, File } from 'lucide-react';
import { SUPPORTED_INPUTS } from '../types';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  lang?: 'en' | 'tr' | 'fr' | 'de' | 'ar';
}

const dropzoneTranslations = {
  en: {
    dropTitleFirst: "Drop your files here, or ",
    dropTitleSecond: "browse",
    dropSub: "Convert PDF, Excel, CSV, Images, Markdown, HTML, JSON, or TXT instantly.",
    browseBtn: "BROWSE LOCAL FILES",
    images: "Images",
    excelCsv: "Excel / CSV",
    pdfDocs: "PDF Docs",
    textMarkup: "MD / JSON / TXT",
  },
  tr: {
    dropTitleFirst: "Dosyalarınızı buraya bırakın veya ",
    dropTitleSecond: "göz atın",
    dropSub: "PDF, Excel, CSV, Görseller, Markdown, HTML, JSON veya TXT dosyalarını anında dönüştürün.",
    browseBtn: "YEREL DOSYALARA GÖZ AT",
    images: "Görseller",
    excelCsv: "Excel / CSV",
    pdfDocs: "PDF Belgeleri",
    textMarkup: "MD / JSON / TXT",
  },
  fr: {
    dropTitleFirst: "Déposez vos fichiers ici, ou ",
    dropTitleSecond: "parcourez",
    dropSub: "Convertissez instantanément PDF, Excel, CSV, Images, Markdown, HTML, JSON ou TXT.",
    browseBtn: "PARCOURIR LES FICHIERS",
    images: "Images",
    excelCsv: "Excel / CSV",
    pdfDocs: "Docs PDF",
    textMarkup: "MD / JSON / TXT",
  },
  de: {
    dropTitleFirst: "Dateien hier ablegen oder ",
    dropTitleSecond: "durchsuchen",
    dropSub: "Konvertieren Sie PDF, Excel, CSV, Bilder, Markdown, HTML, JSON oder TXT sofort.",
    browseBtn: "LOKALE DATEIEN DURCHSUCHEN",
    images: "Bilder",
    excelCsv: "Excel / CSV",
    pdfDocs: "PDF-Dokumente",
    textMarkup: "MD / JSON / TXT",
  },
  ar: {
    dropTitleFirst: "قم بإسقاط ملفاتك هنا، أو ",
    dropTitleSecond: "تصفح",
    dropSub: "قم بتحويل ملفات PDF أو Excel أو CSV أو الصور أو Markdown أو HTML أو JSON أو TXT على الفور.",
    browseBtn: "تصفح الملفات المحلية",
    images: "صور",
    excelCsv: "إكسل / CSV",
    pdfDocs: "ملفات PDF",
    textMarkup: "MD / JSON / TXT",
  }
};

export default function DropZone({ onFilesSelected, lang = 'en' }: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const t = dropzoneTranslations[lang] || dropzoneTranslations.en;

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
      className="w-full relative"
    >
      {/* Outer Hollow Shadow for Dropzone */}
      <div className="absolute inset-0 border-4 border-slate-900 rounded-[32px] translate-x-3 translate-y-3 -z-10 bg-transparent" />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative group cursor-pointer border-4 rounded-[32px] p-10 md:p-14 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[340px] ${
          isDragActive
            ? "border-indigo-600 bg-indigo-50/80"
            : "border-slate-900 bg-white"
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

        <div className="relative mb-4">
          {/* Hollow Shadow for Upload Box */}
          <div className="absolute inset-0 border-4 border-slate-900 rounded-2xl translate-x-1.5 translate-y-1.5 -z-10 bg-transparent" />
          <div className="p-4 bg-white rounded-2xl border-4 border-slate-900 flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
            <Upload className="w-8 h-8 text-slate-900" />
          </div>
        </div>

        <h3 className="mt-4 text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight">
          {t.dropTitleFirst}<span className="text-indigo-600 underline decoration-slate-900 decoration-3 underline-offset-4 group-hover:text-indigo-700 transition-all">{t.dropTitleSecond}</span>
        </h3>
        
        <p className="mt-2 text-sm text-slate-500 font-bold max-w-md mx-auto">
          {t.dropSub}
        </p>

        <div className="relative mt-6">
          {/* Hollow Shadow for Browse Button */}
          <div className="absolute inset-0 border-2 border-slate-900 rounded-xl translate-x-1 translate-y-1 -z-10 bg-transparent" />
          <button className="px-6 py-2.5 bg-white border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider text-slate-900 transition-all">
            {t.browseBtn}
          </button>
        </div>

        {/* Visual Badge Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 w-full max-w-2xl px-2">
          
          {/* Images */}
          <div className="relative group/cat">
            {/* Hollow shadow */}
            <div className="absolute inset-0 border-2 border-slate-900 rounded-xl translate-x-1 translate-y-1 -z-10 bg-transparent" />
            <div className="flex items-center gap-2.5 p-2.5 px-4 rounded-xl bg-blue-50 border-2 border-slate-900 text-xs text-slate-900 font-black justify-center transition-all duration-200">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>{t.images}</span>
            </div>
          </div>

          {/* Excel / CSV */}
          <div className="relative group/cat">
            {/* Hollow shadow */}
            <div className="absolute inset-0 border-2 border-slate-900 rounded-xl translate-x-1 translate-y-1 -z-10 bg-transparent" />
            <div className="flex items-center gap-2.5 p-2.5 px-4 rounded-xl bg-emerald-50 border-2 border-slate-900 text-xs text-slate-900 font-black justify-center transition-all duration-200">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{t.excelCsv}</span>
            </div>
          </div>

          {/* PDF Docs */}
          <div className="relative group/cat">
            {/* Hollow shadow */}
            <div className="absolute inset-0 border-2 border-slate-900 rounded-xl translate-x-1 translate-y-1 -z-10 bg-transparent" />
            <div className="flex items-center gap-2.5 p-2.5 px-4 rounded-xl bg-rose-50 border-2 border-slate-900 text-xs text-slate-900 font-black justify-center transition-all duration-200">
              <FileText className="w-4 h-4 text-rose-600" />
              <span>{t.pdfDocs}</span>
            </div>
          </div>

          {/* MD / JSON / TXT */}
          <div className="relative group/cat">
            {/* Hollow shadow */}
            <div className="absolute inset-0 border-2 border-slate-900 rounded-xl translate-x-1 translate-y-1 -z-10 bg-transparent" />
            <div className="flex items-center gap-2.5 p-1.5 py-2 rounded-xl bg-[#FFFDF5] border-2 border-slate-900 text-[11px] text-slate-900 font-black justify-center leading-none h-full transition-all duration-200">
              <File className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-center font-black">
                {t.textMarkup}
              </span>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
