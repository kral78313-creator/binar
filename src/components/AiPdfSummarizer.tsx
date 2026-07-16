import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, FileText, Send, Copy, Download, 
  Upload, X, Check, AlertCircle, MessageSquare, 
  RefreshCw, ChevronLeft, ChevronRight, HelpCircle
} from 'lucide-react';
import { FileItem } from '../types';
import { convertPdfToText } from '../utils/pdfConverter';

interface AiPdfSummarizerProps {
  files: FileItem[];
  lang: 'en' | 'tr' | 'fr' | 'de' | 'ar';
  selectedPdfItem: FileItem | null;
  onClearSelectedPdf: () => void;
  onAddFiles?: (uploadedFiles: File[]) => void;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

const localTranslations = {
  en: {
    floatingBtn: "AI PDF SUMMARIZER",
    title: "AI PDF Summarizer",
    subtitle: "Extract instant insights and summaries using Gemini AI",
    selectLabel: "Select PDF from Queue",
    noPdfInQueue: "No PDFs in your queue. Drop a PDF here or upload one:",
    orUpload: "— OR —",
    dragDropPdf: "Drag & drop PDF here, or click to browse",
    extractingText: "Extracting text from PDF locally...",
    synthesizing: "Synthesizing summary with Gemini AI...",
    copyBtn: "Copy Summary",
    copied: "Copied!",
    downloadBtn: "Download MD",
    askTitle: "Ask Gemini about this PDF",
    askPlaceholder: "Ask a question about the document content...",
    send: "Send",
    errorText: "Failed to process PDF. Please try again.",
    summaryTitle: "Executive Summary",
    backToSelection: "Select Another PDF",
    noTextFound: "Could not extract any readable text from this PDF.",
    chatLoading: "Thinking...",
    clearChat: "Clear Chat"
  },
  tr: {
    floatingBtn: "YAPAY ZEKA PDF ÖZETLE",
    title: "Yapay Zeka PDF Özetleyici",
    subtitle: "Gemini AI kullanarak saniyeler içinde anında özet ve analiz alın",
    selectLabel: "Sıradan PDF Seçin",
    noPdfInQueue: "Sırada PDF dosyası yok. Buraya bir PDF bırakın veya yükleyin:",
    orUpload: "— VEYA —",
    dragDropPdf: "PDF dosyasını buraya sürükleyin veya göz atmak için tıklayın",
    extractingText: "PDF metni yerel olarak çıkarılıyor...",
    synthesizing: "Gemini AI ile özet sentezleniyor...",
    copyBtn: "Özeti Kopyala",
    copied: "Kopyalandı!",
    downloadBtn: "MD İndir",
    askTitle: "Bu PDF Hakkında Gemini'a Sorun",
    askPlaceholder: "Belge içeriği hakkında bir soru sorun...",
    send: "Gönder",
    errorText: "PDF işlenirken hata oluştu. Lütfen tekrar deneyin.",
    summaryTitle: "Yönetici Özeti",
    backToSelection: "Başka Bir PDF Seç",
    noTextFound: "Bu PDF'den okunabilir metin çıkarılamadı.",
    chatLoading: "Düşünüyor...",
    clearChat: "Sohbeti Temizle"
  },
  fr: {
    floatingBtn: "RÉSUMÉ PDF IA",
    title: "Synthétiseur PDF IA",
    subtitle: "Obtenez des résumés et des analyses instantanés avec Gemini IA",
    selectLabel: "Sélectionner un PDF de la file",
    noPdfInQueue: "Aucun PDF dans la file. Glissez un PDF ici ou importez-le :",
    orUpload: "— OU —",
    dragDropPdf: "Glissez-déposez le PDF ici, ou cliquez pour parcourir",
    extractingText: "Extraction du texte du PDF localement...",
    synthesizing: "Synthèse du résumé avec Gemini IA...",
    copyBtn: "Copier le résumé",
    copied: "Copié !",
    downloadBtn: "Télécharger MD",
    askTitle: "Poser une question sur ce PDF",
    askPlaceholder: "Posez une question sur le contenu...",
    send: "Envoyer",
    errorText: "Échec du traitement du PDF. Veuillez réessayer.",
    summaryTitle: "Résumé Exécutif",
    backToSelection: "Choisir un autre PDF",
    noTextFound: "Impossible d'extraire du texte lisible de ce PDF.",
    chatLoading: "Réflexion...",
    clearChat: "Effacer la discussion"
  },
  de: {
    floatingBtn: "KI-PDF-ZUSAMMENFASSUNG",
    title: "KI-PDF-Zusammenfassung",
    subtitle: "Erhalten Sie sofortige Zusammenfassungen mit Gemini-KI",
    selectLabel: "PDF aus der Warteschlange wählen",
    noPdfInQueue: "Keine PDFs in der Warteschlange. PDF hierher ziehen oder hochladen:",
    orUpload: "— ODER —",
    dragDropPdf: "PDF-Datei hierher ziehen oder klicken",
    extractingText: "PDF-Text wird lokal extrahiert...",
    synthesizing: "KI-Zusammenfassung wird mit Gemini generiert...",
    copyBtn: "Zusammenfassung kopieren",
    copied: "Kopiert!",
    downloadBtn: "MD herunterladen",
    askTitle: "Fragen Sie KI zu diesem PDF",
    askPlaceholder: "Stellen Sie eine Frage zum Dokument...",
    send: "Senden",
    errorText: "PDF-Verarbeitung fehlgeschlagen. Bitte erneut versuchen.",
    summaryTitle: "Zusammenfassung",
    backToSelection: "Anderes PDF wählen",
    noTextFound: "Es konnte kein lesbarer Text aus diesem PDF extrahiert werden.",
    chatLoading: "Nachdenken...",
    clearChat: "Chat leeren"
  },
  ar: {
    floatingBtn: "ملخص الذكاء الاصطناعي",
    title: "ملخص مستندات PDF بالذكاء الاصطناعي",
    subtitle: "احصل على ملخصات وتحليلات فورية باستخدام Gemini AI",
    selectLabel: "اختر ملف PDF من القائمة",
    noPdfInQueue: "لا يوجد ملفات PDF في القائمة. اسحب ملفاً هنا أو قم برفعه:",
    orUpload: "— أو —",
    dragDropPdf: "اسحب ملف PDF هنا، أو انقر للتصفح",
    extractingText: "جاري استخراج النص محلياً...",
    synthesizing: "جاري توليد الملخص بذكاء Gemini الاصطناعي...",
    copyBtn: "نسخ الملخص",
    copied: "تم النسخ!",
    downloadBtn: "تنزيل MD",
    askTitle: "اسأل Gemini حول هذا الملف",
    askPlaceholder: "اطرح سؤالاً حول محتوى المستند...",
    send: "إرسال",
    errorText: "فشل معالجة ملف PDF. يرجى المحاولة مجدداً.",
    summaryTitle: "ملخص تنفيذي",
    backToSelection: "اختر ملف PDF آخر",
    noTextFound: "لم نتمكن من استخراج أي نص قابل للقراءة من هذا الملف.",
    chatLoading: "جاري التفكير...",
    clearChat: "مسح المحادثة"
  }
};

export default function AiPdfSummarizer({ 
  files, 
  lang, 
  selectedPdfItem, 
  onClearSelectedPdf,
  onAddFiles 
}: AiPdfSummarizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'extracting' | 'summarizing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  // Q&A Chat States
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const t = localTranslations[lang] || localTranslations.en;
  const isRtl = lang === 'ar';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const pdfFiles = files.filter(f => f.extension.toLowerCase() === 'pdf');

  // Open drawer and load PDF if selected from FileItemRow
  useEffect(() => {
    if (selectedPdfItem) {
      setIsOpen(true);
      handleLoadPdf(selectedPdfItem.file);
      onClearSelectedPdf();
    }
  }, [selectedPdfItem]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  const handleLoadPdf = async (file: File) => {
    setSelectedFile(file);
    setSelectedFileName(file.name);
    setSummary('');
    setChatHistory([]);
    setExtractedText('');
    setStatus('extracting');
    setProgress(15);

    try {
      // 1. Extract text locally
      const textBlob = await convertPdfToText(file, (p) => {
        setProgress(15 + Math.round(p * 0.4)); // mapping 0-100 to 15-55%
      });
      const text = await textBlob.text();
      
      if (!text || text.trim().length < 10) {
        setStatus('error');
        setExtractedText('');
        return;
      }

      setExtractedText(text);
      setStatus('summarizing');
      setProgress(60);

      // 2. Query our backend API for summary
      const response = await fetch('/api/summarize-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Summary API failed');
      }

      const data = await response.json();
      setSummary(data.result);
      setStatus('completed');
      setProgress(100);
    } catch (err) {
      console.error("PDF summarization flow error:", err);
      setStatus('error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleLoadPdf(file);
      if (onAddFiles) {
        onAddFiles([file]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleLoadPdf(file);
      if (onAddFiles) {
        onAddFiles([file]);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([`# Summary of ${selectedFileName}\n\n${summary}`], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${selectedFileName.replace(/\.[^/.]+$/, "")}_summary.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !extractedText || isChatLoading) return;

    const userQ = question.trim();
    setQuestion('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userQ }]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/summarize-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text: extractedText,
          question: userQ 
        })
      });

      if (!response.ok) {
        throw new Error('Q&A request failed');
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { sender: 'ai', text: data.result }]);
    } catch (err) {
      console.error("Q&A query failed:", err);
      setChatHistory(prev => [...prev, { 
        sender: 'ai', 
        text: lang === 'tr' ? 'Cevap alınamadı, lütfen tekrar deneyin.' : 'Could not get an answer, please try again.' 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatMarkdown = (md: string) => {
    // A lightweight safe custom renderer for summary markdown
    return md.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-black text-slate-900 mt-4 mb-2 border-b-2 border-slate-200 pb-1">{trimmed.slice(2)}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-black text-slate-900 mt-3 mb-2">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-bold text-slate-900 mt-2 mb-1">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return <li key={idx} className="ml-5 list-disc text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold my-1">{trimmed.slice(2)}</li>;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return <li key={idx} className="ml-5 list-decimal text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold my-1">{trimmed.replace(/^\d+\.\s/, '')}</li>;
      }
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed my-1.5">{line}</p>;
    });
  };

  return (
    <>
      {/* Floating Side Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-amber-300 border-4 border-slate-900 rounded-l-2xl p-3 sm:p-4 flex flex-col items-center gap-2.5 shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[-6px_6px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-slate-900 select-none border-r-0`}
        id="floating-ai-summarizer-button"
      >
        <div className="bg-white p-2 rounded-full border-2 border-slate-900 animate-pulse">
          <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-100" />
        </div>
        <span className="font-black text-[10px] tracking-wider writing-mode-vertical uppercase">
          {t.floatingBtn}
        </span>
      </motion.button>

      {/* Slide-out Panel Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
              id="ai-summarizer-backdrop"
            />

            {/* Sidebar Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`fixed top-0 bottom-0 ${isRtl ? 'left-0 border-r-4' : 'right-0 border-l-4'} w-full sm:w-[480px] md:w-[540px] bg-[#FFFBEB] z-50 flex flex-col border-slate-900 shadow-[-10px_0px_0px_0px_rgba(0,0,0,1)] overflow-hidden`}
              dir={isRtl ? 'rtl' : 'ltr'}
              id="ai-summarizer-sidebar"
            >
              {/* Drawer Header */}
              <div className="bg-amber-100 p-5 border-b-4 border-slate-900 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {t.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                      {t.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 text-slate-700 hover:text-slate-900 bg-rose-200 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
                {/* IDLE / CHOOSE FILE STAGE */}
                {status === 'idle' && (
                  <div className="flex flex-col gap-6 flex-1 justify-center">
                    {/* Select from existing files queue */}
                    {pdfFiles.length > 0 && (
                      <div className="bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
                          {t.selectLabel}
                        </label>
                        <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                          {pdfFiles.map((f) => (
                            <button
                              key={f.id}
                              onClick={() => handleLoadPdf(f.file)}
                              className="w-full flex items-center justify-between p-3 border-2 border-slate-200 hover:border-slate-900 hover:bg-amber-50 rounded-xl transition-all text-left font-semibold text-xs sm:text-sm text-slate-800 cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                <span className="truncate">{f.name}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {pdfFiles.length > 0 && (
                      <div className="text-center font-black text-xs text-slate-400 tracking-widest uppercase">
                        {t.orUpload}
                      </div>
                    )}

                    {/* Drag & Drop or Browse file upload */}
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white border-4 border-dashed border-slate-300 hover:border-slate-900 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-radial-gradient"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="application/pdf"
                        className="hidden"
                      />
                      <div className="p-4 bg-amber-100 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4">
                        <Upload className="w-8 h-8 text-indigo-600" />
                      </div>
                      <p className="text-sm font-black text-slate-800">
                        {t.dragDropPdf}
                      </p>
                      <p className="text-xs text-slate-400 font-bold mt-2">
                        PDF only • Maximum 20MB
                      </p>
                    </div>
                  </div>
                )}

                {/* LOADING / PROCESSING STATE */}
                {(status === 'extracting' || status === 'summarizing') && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 p-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-white border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                        <FileText className="w-10 h-10 text-rose-500 animate-bounce" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-indigo-400 border-2 border-slate-900 rounded-full p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <RefreshCw className="w-4 h-4 text-slate-900 animate-spin" />
                      </div>
                    </div>

                    <div className="w-full max-w-[280px]">
                      <div className="h-4 w-full bg-white border-2 border-slate-900 rounded-full overflow-hidden p-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <motion.div 
                          className="h-full bg-indigo-500 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                      <div className="text-[10px] font-black text-slate-400 tracking-wider text-right mt-1.5">
                        {progress}%
                      </div>
                    </div>

                    <p className="text-sm font-black text-slate-900 animate-pulse">
                      {status === 'extracting' ? t.extractingText : t.synthesizing}
                    </p>
                  </div>
                )}

                {/* ERROR STATE */}
                {status === 'error' && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
                    <div className="p-4 bg-rose-100 border-2 border-slate-900 rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <AlertCircle className="w-10 h-10 text-rose-600" />
                    </div>
                    <h4 className="text-base font-black text-slate-900">
                      {t.errorText}
                    </h4>
                    <p className="text-xs text-slate-500 font-bold max-w-xs">
                      {t.noTextFound}
                    </p>
                    <button
                      onClick={() => setStatus('idle')}
                      className="mt-2 flex items-center gap-2 p-2.5 px-6 text-xs font-black text-slate-900 bg-amber-300 hover:bg-amber-200 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{t.backToSelection}</span>
                    </button>
                  </div>
                )}

                {/* COMPLETED RESULT & CHAT STAGE */}
                {status === 'completed' && (
                  <div className="flex flex-col gap-6">
                    {/* Selected File Banner */}
                    <div className="bg-white border-2 border-slate-900 rounded-xl p-3 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate" title={selectedFileName}>
                          {selectedFileName}
                        </span>
                      </div>
                      <button
                        onClick={() => setStatus('idle')}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 underline flex-shrink-0 ml-2 cursor-pointer"
                      >
                        {t.backToSelection}
                      </button>
                    </div>

                    {/* Summary Result Box */}
                    <div className="bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          {t.summaryTitle}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopy}
                            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-300 transition-all cursor-pointer"
                            title={t.copyBtn}
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={handleDownload}
                            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-300 transition-all cursor-pointer"
                            title={t.downloadBtn}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto pr-1 select-text">
                        {formatMarkdown(summary)}
                      </div>
                    </div>

                    {/* Interactive Q&A Chat */}
                    <div className="bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-indigo-500" />
                          {t.askTitle}
                        </span>

                        {chatHistory.length > 0 && (
                          <button
                            onClick={() => setChatHistory([])}
                            className="text-[10px] font-black text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            {t.clearChat}
                          </button>
                        )}
                      </div>

                      {/* Chat Message Logs */}
                      <div className="max-h-[220px] overflow-y-auto flex flex-col gap-3 pr-1">
                        {chatHistory.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 font-bold flex flex-col items-center gap-2">
                            <HelpCircle className="w-8 h-8 text-slate-300" />
                            <span className="text-xs">{lang === 'tr' ? 'PDF içeriği hakkında istediğiniz her şeyi sorabilirsiniz!' : 'Ask anything about the PDF contents!'}</span>
                          </div>
                        ) : (
                          chatHistory.map((msg, i) => (
                            <div 
                              key={i} 
                              className={`flex flex-col gap-1 max-w-[85%] ${
                                msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                              }`}
                            >
                              <div 
                                className={`p-3 rounded-2xl text-xs sm:text-sm font-semibold leading-relaxed border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                  msg.sender === 'user' 
                                    ? 'bg-indigo-100 text-slate-900' 
                                    : 'bg-amber-50 text-slate-900'
                                }`}
                              >
                                {msg.sender === 'ai' ? formatMarkdown(msg.text) : msg.text}
                              </div>
                            </div>
                          ))
                        )}

                        {isChatLoading && (
                          <div className="self-start max-w-[80%] flex items-center gap-2 p-3 bg-amber-50 border-2 border-slate-900 rounded-2xl text-xs font-black text-slate-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                            <span>{t.chatLoading}</span>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Ask Input form */}
                      <form onSubmit={handleAskQuestion} className="flex gap-2.5">
                        <input
                          type="text"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder={t.askPlaceholder}
                          disabled={isChatLoading}
                          className="flex-1 bg-amber-50 hover:bg-white border-2 border-slate-900 rounded-xl p-2.5 text-xs sm:text-sm font-bold placeholder-slate-400 focus:outline-none focus:bg-white shadow-inner"
                        />
                        <button
                          type="submit"
                          disabled={!question.trim() || isChatLoading}
                          className={`p-2.5 px-4 rounded-xl border-2 border-slate-900 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer ${
                            question.trim() && !isChatLoading
                              ? 'bg-indigo-400 text-slate-900 hover:bg-indigo-300'
                              : 'bg-slate-100 text-slate-400 border-slate-300 shadow-none cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
