import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileCheck, Shield, Zap, Sparkles, FolderUp, 
  Trash2, RefreshCw, Check, AlertTriangle, Download,
  ChevronDown, Globe
} from 'lucide-react';

import { FileItem, CONVERSION_MAP, ConvertedResult } from './types';
import DropZone from './components/DropZone';
import FileItemRow, { formatBytes } from './components/FileItemRow';
import PreviewModal from './components/PreviewModal';
import GoogleAuth from './components/GoogleAuth';
import { Flag } from './components/Flag';
import AiPdfSummarizer from './components/AiPdfSummarizer';

import * as XLSX from 'xlsx';

// Conversion Utility imports
import { convertImage } from './utils/imageConverter';
import { convertPdfToImages, convertPdfToText } from './utils/pdfConverter';
import { 
  convertSpreadsheetToPdf, 
  convertSpreadsheetToCsv, 
  convertSpreadsheetToJson, 
  convertSpreadsheetToHtml, 
  convertCsvToXlsx, 
  convertSpreadsheetToHtmlString,
  parseSpreadsheet
} from './utils/excelConverter';
import { 
  convertTextToPdf, 
  convertJsonToSpreadsheet, 
  markdownToHtml, 
  htmlToMarkdown,
  jsonToXml,
  xmlToJson,
  workbookToXml,
  markdownToRtf,
  rtfToText,
  convertHtmlToDocx,
  parseDocxText,
  convertTextToPptx,
  parsePptxText
} from './utils/textConverter';
import {
  extractAudioFromVideo,
  createAudioVisualizerVideo,
  convertImageToVideo
} from './utils/mediaConverter';

// Translation helper APIs
async function translateTextContent(text: string, targetLanguage: string, format: string): Promise<string> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, targetLanguage, format }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to translate document content');
  }
  const data = await response.json();
  return data.translatedText;
}

async function translateSpreadsheetData(data: any[][], targetLanguage: string): Promise<any[][]> {
  const textRepresentation = JSON.stringify(data);
  const translatedStr = await translateTextContent(textRepresentation, targetLanguage, 'json');
  try {
    return JSON.parse(translatedStr);
  } catch (e) {
    console.error("Failed to parse translated spreadsheet JSON, returning original", e);
    return data;
  }
}

const langLabels = {
  en: "Change web page language:",
  tr: "Web sayfasının dilini değiştirin:",
  fr: "Changer la langue de la page web :",
  de: "Sprache der Webseite ändern:",
  ar: "تغيير لغة صفحة الويب:"
};

const translations = {
  en: {
    banner: "FREE DOCUMENT CONVERTER",
    secureLocal: "SECURE LOCAL",
    tagline: "Lightning-fast local document conversion. All process completed directly inside your browser.",
    instantWasm: "⚡ INSTANT WEBASSEMBLY",
    queueTitle: "File Conversion Queue",
    filesCountSingle: "file",
    filesCountPlural: "files",
    convertAll: "Convert All",
    downloadAll: "Download All",
    clearAll: "Clear All",
    privateTitle: "100% Private",
    privateDesc: "All transformations happen locally on your system using WebAssembly and client-side modules. Your sensitive data is never uploaded to any server.",
    instantTitle: "Instant Conversion",
    instantDesc: "No network delays, upload buffers, or wait times in server queues. Document processing finishes instantly in a matter of seconds.",
    previewTitle: "Local Previews",
    previewDesc: "Inspect sheets, read text documents, parse markup, and view high-resolution page-by-page images directly in our interactive lightbox player.",
    historyTitle: "Conversion History",
    historyEmpty: "No conversion history yet. Drag & drop files above to start converting!",
    clearHistory: "Clear History",
    historyOriginal: "Original File",
    historyConverted: "Converted File",
    historySize: "Size",
    historyDate: "Date",
    historyStatus: "Status",
    historyAction: "Action",
    historySessionBadge: "Active Session",
    historyPastBadge: "Expired",
    downloadAgain: "Download",
    convertAgain: "Convert Again",
    historyFailed: "Failed"
  },
  tr: {
    banner: "ÜCRETSİZ BELGE DÖNÜŞTÜRÜCÜ",
    secureLocal: "GÜVENLİ YEREL",
    tagline: "Işık hızında yerel belge dönüştürme. Tüm işlemler doğrudan tarayıcınızda tamamlanır.",
    instantWasm: "⚡ ANINDA WEBASSEMBLY",
    queueTitle: "Dosya Dönüştürme Sırası",
    filesCountSingle: "dosya",
    filesCountPlural: "dosya",
    convertAll: "Tümünü Dönüştür",
    downloadAll: "Tümünü İndir",
    clearAll: "Tümünü Temizle",
    privateTitle: "%100 Güvenli",
    privateDesc: "Tüm dönüşümler WebAssembly ve istemci tarafı modülleriyle yerel olarak bilgisayarınızda gerçekleşir. Hassas verileriniz asla sunucuya yüklenmez.",
    instantTitle: "Anında Dönüşüm",
    instantDesc: "Ağ gecikmesi, yükleme beklemesi veya sunucu sırası yok. Belge işleme saniyeler içinde anında tamamlanır.",
    previewTitle: "Yerel Önizlemeler",
    previewDesc: "Etkileşimli önizleme penceremizde sayfaları inceleyin, metin belgelerini okuyun ve yüksek çözünürlüklü sayfa görsellerini görüntüleyin.",
    historyTitle: "Dönüşüm Geçmişi",
    historyEmpty: "Henüz dönüşüm geçmişi yok. Dönüştürmeye başlamak için yukarıya dosya sürükleyip bırakın!",
    clearHistory: "Geçmişi Temizle",
    historyOriginal: "Orijinal Dosya",
    historyConverted: "Dönüştürülen Dosya",
    historySize: "Boyut",
    historyDate: "Tarih",
    historyStatus: "Durum",
    historyAction: "İşlem",
    historySessionBadge: "Mevcut Oturum",
    historyPastBadge: "Süresi Doldu",
    downloadAgain: "İndir",
    convertAgain: "Tekrar Dönüştür",
    historyFailed: "Başarısız"
  },
  fr: {
    banner: "CONVERTISSEUR DE DOCUMENTS GRATUIT",
    secureLocal: "LOCAL SÉCURISÉ",
    tagline: "Conversion de documents locale ultra-rapide. Tout est traité directement dans votre navigateur.",
    instantWasm: "⚡ WEBASSEMBLY INSTANTANÉ",
    queueTitle: "File d'attente de conversion",
    filesCountSingle: "fichier",
    filesCountPlural: "fichiers",
    convertAll: "Tout convertir",
    downloadAll: "Tout télécharger",
    clearAll: "Tout effacer",
    privateTitle: "100% Privé",
    privateDesc: "Toutes les transformations ont lieu localement sur votre système via WebAssembly. Vos données sensibles ne sont jamais envoyées à un serveur.",
    instantTitle: "Conversion Instantanée",
    instantDesc: "Pas de latence réseau ni de files d'attente. Le traitement des documents se termine instantanément en quelques secondes.",
    previewTitle: "Aperçus Locaux",
    previewDesc: "Inspectez les feuilles, lisez les documents texte et visualisez les images haute résolution directement dans notre lecteur interactif.",
    historyTitle: "Historique de conversion",
    historyEmpty: "Aucun historique de conversion pour le moment. Glissez-déposez des fichiers ci-dessus pour commencer !",
    clearHistory: "Effacer l'historique",
    historyOriginal: "Fichier d'origine",
    historyConverted: "Fichier converti",
    historySize: "Taille",
    historyDate: "Date",
    historyStatus: "Statut",
    historyAction: "Action",
    historySessionBadge: "Session active",
    historyPastBadge: "Expiré",
    downloadAgain: "Télécharger",
    convertAgain: "Reconvertir",
    historyFailed: "Échoué"
  },
  de: {
    banner: "KOSTENLOSER DOKUMENTENKONVERTER",
    secureLocal: "SICHER LOKAL",
    tagline: "Blitzschnelle lokale Dokumentenkonvertierung. Alle Prozesse werden direkt in Ihrem Browser ausgeführt.",
    instantWasm: "⚡ SOFORTIGES WEBASSEMBLY",
    queueTitle: "Konvertierungswarteschlange",
    filesCountSingle: "Datei",
    filesCountPlural: "Dateien",
    convertAll: "Alle konvertieren",
    downloadAll: "Alle herunterladen",
    clearAll: "Alle löschen",
    privateTitle: "100% Privat",
    privateDesc: "Alle Konvertierungen finden lokal auf Ihrem System mit WebAssembly statt. Ihre sensiblen Daten werden niemals auf einen Server hochgeladen.",
    instantTitle: "Sofortige Konvertierung",
    instantDesc: "Keine Netzwerkverzögerungen, Upload-Buffer oder Wartezeiten in Server-Warteschlangen. Die Verarbeitung erfolgt in wenigen Sekunden.",
    previewTitle: "Lokale Vorschau",
    previewDesc: "Prüfen Sie Tabellen, lesen Sie Textdokumente und betrachten Sie hochauflösende Bilder direkt in unserem interaktiven Player.",
    historyTitle: "Konvertierungsverlauf",
    historyEmpty: "Noch kein Konvertierungsverlauf. Ziehen Sie oben Dateien hinein, um zu konvertieren!",
    clearHistory: "Verlauf löschen",
    historyOriginal: "Originaldatei",
    historyConverted: "Konvertierte Datei",
    historySize: "Größe",
    historyDate: "Datum",
    historyStatus: "Status",
    historyAction: "Aktion",
    historySessionBadge: "Aktive Sitzung",
    historyPastBadge: "Abgelaufen",
    downloadAgain: "Herunterladen",
    convertAgain: "Erneut konvertieren",
    historyFailed: "Fehlgeschlagen"
  },
  ar: {
    banner: "محول المستندات المجاني",
    secureLocal: "محلي آمن",
    tagline: "تحويل مستندات محلي بسرعة فائقة. تكتمل جميع العمليات مباشرة داخل متصفحك.",
    instantWasm: "⚡ ويب أسمبلي فوري",
    queueTitle: "قائمة تحويل الملفات",
    filesCountSingle: "ملف",
    filesCountPlural: "ملفات",
    convertAll: "تحويل الكل",
    downloadAll: "تنزيل الكل",
    clearAll: "مسح الكل",
    privateTitle: "خاص وآمن 100%",
    privateDesc: "تحدث جميع التحويلات محليًا على جهازك باستخدام WebAssembly والمودولات البرمجية الخاصة بجهة العميل. لا يتم رفع بياناتك الحساسة إلى أي خادم على الإطلاق.",
    instantTitle: "تحويل فوري",
    instantDesc: "لا يوجد تأخير في الشبكة، أو فترات انتظار في طوابير الخادم. تنتهي معالجة المستندات فورًا في غضون ثوانٍ.",
    previewTitle: "معاينات محلية",
    previewDesc: "تفقد جداول البيانات، واقرأ المستندات النصية، واعرض صور الصفحات بدقة عالية مباشرةً في نافذة المعاينة التفاعلية.",
    historyTitle: "سجل التحويلات",
    historyEmpty: "لا يوجد سجل للتحويلات بعد. قم بسحب وإسقاط الملفات أعلاه لبدء التحويل!",
    clearHistory: "مسح السجل",
    historyOriginal: "الملف الأصلي",
    historyConverted: "الملف المحول",
    historySize: "الحجم",
    historyDate: "التاريخ",
    historyStatus: "الحالة",
    historyAction: "الإجراء",
    historySessionBadge: "الجلسة النشطة",
    historyPastBadge: "منتهي الصلاحية",
    downloadAgain: "تنزيل",
    convertAgain: "تحويل مجدداً",
    historyFailed: "فشل"
  }
};

interface HistoryItem {
  id: string;
  originalName: string;
  convertedName: string;
  fromFormat: string;
  toFormat: string;
  size: number;
  timestamp: number;
  status: 'completed' | 'failed';
  error?: string;
}

export default function App() {
  const [lang, setLang] = useState<'en' | 'tr' | 'fr' | 'de' | 'ar'>(() => {
    const saved = localStorage.getItem('swift_shift_lang');
    return (saved as 'en' | 'tr' | 'fr' | 'de' | 'ar') || 'en';
  });

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('swift_shift_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sessionBlobs, setSessionBlobs] = useState<Record<string, { url: string; name: string }>>({});

  useEffect(() => {
    localStorage.setItem('swift_shift_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSetLang = (newLang: 'en' | 'tr' | 'fr' | 'de' | 'ar') => {
    setLang(newLang);
    localStorage.setItem('swift_shift_lang', newLang);
    setIsLangOpen(false);
  };

  const [files, setFiles] = useState<FileItem[]>([]);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  const [selectedPdfItem, setSelectedPdfItem] = useState<FileItem | null>(null);
  const [isBulkConverting, setIsBulkConverting] = useState(false);

  const t = translations[lang] || translations.en;

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

  // Update target language for a specific file
  const handleUpdateTargetLanguage = (id: string, language: string) => {
    setFiles(prev => prev.map(item => 
      item.id === id ? { ...item, targetLanguage: language } : item
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

      // Append to history log
      const historyId = crypto.randomUUID();
      const historyItem: HistoryItem = {
        id: historyId,
        originalName: fileItem.name,
        convertedName: convertedResult.name,
        fromFormat: fileItem.extension.toUpperCase(),
        toFormat: fileItem.targetFormat!.toUpperCase(),
        size: fileItem.size,
        timestamp: Date.now(),
        status: 'completed'
      };
      setHistory(prev => [historyItem, ...prev]);

      // Map session blob for re-downloading
      setSessionBlobs(prev => ({
        ...prev,
        [historyId]: { url: convertedResult.url, name: convertedResult.name }
      }));
    } catch (err: any) {
      console.error('Conversion error:', err);
      setFiles(prev => prev.map(f => 
        f.id === id ? { 
          ...f, 
          status: 'failed', 
          error: err.message || 'An error occurred during conversion' 
        } : f
      ));

      // Append failed conversion to history
      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        originalName: fileItem.name,
        convertedName: '—',
        fromFormat: fileItem.extension.toUpperCase(),
        toFormat: fileItem.targetFormat!.toUpperCase(),
        size: fileItem.size,
        timestamp: Date.now(),
        status: 'failed',
        error: err.message || 'Conversion failed'
      };
      setHistory(prev => [historyItem, ...prev]);
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

    let finalSourceFile = item.file;

    // Apply pre-conversion translation if targetLanguage is set
    if (item.targetLanguage) {
      onProgress(10);
      if (['txt', 'md', 'json', 'html', 'csv'].includes(ext)) {
        const originalText = await item.file.text();
        const translatedText = await translateTextContent(originalText, item.targetLanguage, ext);
        finalSourceFile = new File([translatedText], item.name, { type: item.file.type });
      } else if (['xlsx', 'xls'].includes(ext)) {
        const wb = await parseSpreadsheet(item.file);
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        
        const translatedData = await translateSpreadsheetData(data, item.targetLanguage);
        
        // Re-encode to a temporary xlsx File
        const tempWs = XLSX.utils.aoa_to_sheet(translatedData);
        const tempWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(tempWb, tempWs, 'Sheet 1');
        const out = XLSX.write(tempWb, { bookType: 'xlsx', type: 'array' });
        const translatedBlob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        finalSourceFile = new File([translatedBlob], item.name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      }
      onProgress(40);
    }

    // 1. PDF Sources
    if (ext === 'pdf') {
      if (target === 'png' || target === 'jpg') {
        const imgPages = await convertPdfToImages(finalSourceFile, target, onProgress);
        if (imgPages.length === 0) throw new Error('Failed to render PDF pages to images');
        resultBlob = imgPages[0].blob; // Default fallback to first page
        multipleFiles = imgPages;
      } else if (target === 'txt') {
        resultBlob = await convertPdfToText(finalSourceFile, onProgress);
        let txt = await resultBlob.text();
        if (item.targetLanguage) {
          txt = await translateTextContent(txt, item.targetLanguage, 'txt');
          resultBlob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        }
        previewContent = txt;
      } else if (target === 'docx') {
        const textBlob = await convertPdfToText(finalSourceFile, onProgress);
        const txt = await textBlob.text();
        const htmlBody = `<p>${txt.replace(/\n/g, '<br>')}</p>`;
        resultBlob = convertHtmlToDocx(htmlBody);
        previewContent = htmlBody;
      } else if (target === 'pptx') {
        const textBlob = await convertPdfToText(finalSourceFile, onProgress);
        const txt = await textBlob.text();
        resultBlob = convertTextToPptx(txt, finalSourceFile.name);
        previewContent = txt;
      } else {
        throw new Error(`Conversion from PDF to ${target.toUpperCase()} is not supported.`);
      }
    }
    // 2. Spreadsheet Sources (xlsx, xls, csv)
    else if (['xlsx', 'xls', 'csv'].includes(ext)) {
      if (target === 'pdf') {
        resultBlob = await convertSpreadsheetToPdf(finalSourceFile, onProgress);
      } else if (target === 'csv') {
        resultBlob = await convertSpreadsheetToCsv(finalSourceFile);
        previewContent = await resultBlob.text();
      } else if (target === 'json') {
        resultBlob = await convertSpreadsheetToJson(finalSourceFile);
        previewContent = await resultBlob.text();
      } else if (target === 'html') {
        resultBlob = await convertSpreadsheetToHtml(finalSourceFile);
        previewContent = await convertSpreadsheetToHtmlString(finalSourceFile);
      } else if (target === 'xml') {
        const wb = await parseSpreadsheet(finalSourceFile);
        const xmlStr = workbookToXml(wb);
        resultBlob = new Blob([xmlStr], { type: 'application/xml;charset=utf-8' });
        previewContent = xmlStr;
      } else if (ext === 'csv' && target === 'xlsx') {
        resultBlob = await convertCsvToXlsx(finalSourceFile);
      } else {
        throw new Error(`Conversion from spreadsheet to ${target.toUpperCase()} is not supported.`);
      }
    }
    // 3. Text & Markup Sources (txt, md, json, html, xml, rtf, docx, pptx)
    else if (['txt', 'md', 'json', 'html', 'xml', 'rtf', 'docx', 'pptx'].includes(ext)) {
      if (ext === 'docx') {
        const docxText = await parseDocxText(finalSourceFile);
        if (target === 'pdf') {
          resultBlob = convertTextToPdf(docxText, finalSourceFile.name, false);
        } else if (target === 'txt') {
          resultBlob = new Blob([docxText], { type: 'text/plain;charset=utf-8' });
          previewContent = docxText;
        } else if (target === 'html') {
          const htmlBody = `<p>${docxText.replace(/\n/g, '<br>')}</p>`;
          resultBlob = new Blob([htmlBody], { type: 'text/html;charset=utf-8' });
          previewContent = htmlBody;
        } else {
          throw new Error(`Unsupported DOCX target format: ${target.toUpperCase()}`);
        }
      } else if (ext === 'pptx') {
        const pptxText = await parsePptxText(finalSourceFile);
        if (target === 'pdf') {
          resultBlob = convertTextToPdf(pptxText, finalSourceFile.name, false);
        } else if (target === 'txt') {
          resultBlob = new Blob([pptxText], { type: 'text/plain;charset=utf-8' });
          previewContent = pptxText;
        } else {
          throw new Error(`Unsupported PPTX target format: ${target.toUpperCase()}`);
        }
      } else {
        const textContent = await finalSourceFile.text();
        
        if (target === 'docx') {
          let htmlBody = '';
          if (ext === 'md') {
            htmlBody = markdownToHtml(textContent);
          } else if (ext === 'html') {
            htmlBody = textContent;
          } else {
            htmlBody = `<p>${textContent.replace(/\n/g, '<br>')}</p>`;
          }
          resultBlob = convertHtmlToDocx(htmlBody);
          previewContent = htmlBody;
        } else if (target === 'pptx') {
          resultBlob = convertTextToPptx(textContent, finalSourceFile.name);
          previewContent = textContent;
        } else if (ext === 'json') {
          if (target === 'csv' || target === 'xlsx') {
            resultBlob = await convertJsonToSpreadsheet(finalSourceFile, target);
            if (target === 'csv') previewContent = await resultBlob.text();
          } else if (target === 'txt') {
            resultBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
            previewContent = textContent;
          } else if (target === 'xml') {
            const xmlStr = jsonToXml(textContent);
            resultBlob = new Blob([xmlStr], { type: 'application/xml;charset=utf-8' });
            previewContent = xmlStr;
          } else {
            throw new Error(`Unsupported JSON target format: ${target.toUpperCase()}`);
          }
        } else if (ext === 'xml') {
          if (target === 'json') {
            const jsonStr = xmlToJson(textContent);
            resultBlob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
            previewContent = jsonStr;
          } else if (target === 'csv') {
            const jsonStr = xmlToJson(textContent);
            resultBlob = await convertJsonToSpreadsheet(new File([jsonStr], 'temp.json', { type: 'application/json' }), 'csv');
            previewContent = await resultBlob.text();
          } else if (target === 'txt') {
            const plainText = textContent.replace(/<[^>]+>/g, '').trim();
            resultBlob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
            previewContent = plainText;
          } else {
            throw new Error(`Unsupported XML target format: ${target.toUpperCase()}`);
          }
        } else if (ext === 'rtf') {
          const plainText = rtfToText(textContent);
          if (target === 'txt') {
            resultBlob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
            previewContent = plainText;
          } else if (target === 'pdf') {
            resultBlob = convertTextToPdf(plainText, finalSourceFile.name, false);
          } else if (target === 'html') {
            const htmlBody = `<p>${plainText.replace(/\n/g, '<br>')}</p>`;
            resultBlob = new Blob([htmlBody], { type: 'text/html;charset=utf-8' });
            previewContent = htmlBody;
          } else {
            throw new Error(`Unsupported RTF target format: ${target.toUpperCase()}`);
          }
        } else if (target === 'pdf') {
          resultBlob = convertTextToPdf(textContent, finalSourceFile.name, ext === 'md');
        } else if (ext === 'md' && target === 'html') {
          const htmlBody = markdownToHtml(textContent);
          const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${htmlBody}</body></html>`;
          resultBlob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
          previewContent = htmlBody;
        } else if (ext === 'md' && target === 'txt') {
          resultBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
          previewContent = textContent;
        } else if (ext === 'md' && target === 'rtf') {
          const rtfStr = markdownToRtf(textContent);
          resultBlob = new Blob([rtfStr], { type: 'application/rtf;charset=utf-8' });
          previewContent = rtfStr;
        } else if (ext === 'html' && target === 'md') {
          const mdBody = htmlToMarkdown(textContent);
          resultBlob = new Blob([mdBody], { type: 'text/markdown;charset=utf-8' });
          previewContent = mdBody;
        } else if (ext === 'html' && target === 'txt') {
          const plainText = htmlToMarkdown(textContent);
          resultBlob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
          previewContent = plainText;
        } else if (ext === 'html' && target === 'rtf') {
          const plainText = htmlToMarkdown(textContent);
          const rtfStr = markdownToRtf(plainText);
          resultBlob = new Blob([rtfStr], { type: 'application/rtf;charset=utf-8' });
          previewContent = rtfStr;
        } else if (ext === 'txt' && target === 'md') {
          resultBlob = new Blob([textContent], { type: 'text/markdown;charset=utf-8' });
          previewContent = textContent;
        } else if (ext === 'txt' && target === 'html') {
          const htmlBody = `<p>${textContent.replace(/\n/g, '<br>')}</p>`;
          resultBlob = new Blob([htmlBody], { type: 'text/html;charset=utf-8' });
          previewContent = htmlBody;
        } else if (ext === 'txt' && target === 'rtf') {
          const rtfStr = markdownToRtf(textContent);
          resultBlob = new Blob([rtfStr], { type: 'application/rtf;charset=utf-8' });
          previewContent = rtfStr;
        } else if (ext === 'txt' && target === 'json') {
          let jsonStr = '';
          try {
            JSON.parse(textContent);
            jsonStr = textContent;
          } catch {
            jsonStr = JSON.stringify({ content: textContent }, null, 2);
          }
          resultBlob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
          previewContent = jsonStr;
        } else if (ext === 'txt' && target === 'xml') {
          const xmlStr = `<?xml version="1.0" encoding="UTF-8"?>\n<document>\n  <body>${textContent.replace(/[<>&'"]/g, c => {
            switch (c) {
              case '<': return '&lt;';
              case '>': return '&gt;';
              case '&': return '&amp;';
              case '\'': return '&apos;';
              case '"': return '&quot;';
              default: return c;
            }
          })}</body>\n</document>`;
          resultBlob = new Blob([xmlStr], { type: 'application/xml;charset=utf-8' });
          previewContent = xmlStr;
        } else {
          throw new Error(`Unsupported text conversion target: ${target.toUpperCase()}`);
        }
      }
    }
    // 4. Image Sources (png, jpg, jpeg, webp, gif, bmp)
    else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
      if (target === 'mp4') {
        resultBlob = await convertImageToVideo(finalSourceFile, onProgress);
      } else {
        resultBlob = await convertImage(finalSourceFile, target, onProgress);
      }
    }
    // 5. Media Sources (mp3, mp4, wav)
    else if (['mp3', 'mp4', 'wav'].includes(ext)) {
      if (ext === 'mp4') {
        if (target === 'mp3') {
          resultBlob = await extractAudioFromVideo(finalSourceFile, onProgress);
        } else if (target === 'gif') {
          throw new Error('Please select MP4 to MP3 extraction, or use audio files.');
        } else {
          throw new Error(`Unsupported MP4 target format: ${target.toUpperCase()}`);
        }
      } else if (ext === 'mp3' || ext === 'wav') {
        if (target === 'mp4') {
          resultBlob = await createAudioVisualizerVideo(finalSourceFile, onProgress);
        } else if (target === 'wav' && ext === 'mp3') {
          resultBlob = await extractAudioFromVideo(finalSourceFile, onProgress);
        } else if (target === 'mp3' && ext === 'wav') {
          resultBlob = new Blob([await finalSourceFile.arrayBuffer()], { type: 'audio/wav' });
        } else {
          throw new Error(`Unsupported audio conversion from ${ext.toUpperCase()} to ${target.toUpperCase()}`);
        }
      }
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
      <div className="bg-slate-900 text-amber-300 py-2 px-6 border-b-4 border-slate-900 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
        <span>★</span>
        <span>{t.banner}</span>
        <span>★</span>
      </div>

      {/* Main Core View Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 md:p-12 flex flex-col gap-10">
        
        {/* App Branding & Header - Neobrutalist Nav Card with Hollow Shadow */}
        <div className="relative">
          {/* Hollow Shadow */}
          <div className="absolute inset-0 border-4 border-slate-900 rounded-3xl translate-x-2 translate-y-2 -z-10 bg-transparent" />
          
          <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3 bg-indigo-600 text-white rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-3 flex-shrink-0">
                <FileCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex flex-wrap items-center gap-2">
                  SWIFT.SHIFT
                  <span className="flex items-center gap-1 text-[10px] font-black bg-slate-950 text-white border-2 border-slate-900 p-1 px-2.5 rounded-full uppercase tracking-wider">
                    <Shield className="w-3 h-3" /> {t.secureLocal}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-bold mt-1.5 leading-relaxed">
                  {t.tagline}
                </p>

                {/* Circular Language Selector Dropdown */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5 relative" id="language-switcher" ref={langDropdownRef}>
                  <span className="text-xs font-bold text-slate-500">{langLabels[lang]}</span>
                  <div className="relative">
                    {/* Round button representing selected language flag */}
                    <button
                      onClick={() => setIsLangOpen(!isLangOpen)}
                      className="w-10 h-10 rounded-full border-2 border-slate-900 bg-amber-100 hover:bg-amber-200 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer"
                      title={lang === 'en' ? 'English' : lang === 'tr' ? 'Türkçe' : lang === 'fr' ? 'Français' : lang === 'de' ? 'Deutsch' : 'العربية'}
                    >
                      <Flag lang={lang} className="w-7 h-5 border border-slate-900 rounded-sm shadow-none" />
                    </button>

                    {/* Popover Dropdown menu */}
                    <AnimatePresence>
                      {isLangOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 mt-2 w-44 bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 overflow-hidden"
                        >
                          <div className="p-1 flex flex-col gap-1">
                            {(['en', 'tr', 'fr', 'de', 'ar'] as const).map((l) => (
                              <button
                                key={l}
                                onClick={() => handleSetLang(l)}
                                className={`flex items-center gap-3 w-full text-left px-3 py-2 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                                  lang === l
                                    ? 'bg-amber-100 text-slate-950'
                                    : 'bg-transparent text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <Flag lang={l} className="w-5 h-3.5 border border-slate-900 rounded-sm" />
                                <span>
                                  {l === 'en' ? 'English' : l === 'tr' ? 'Türkçe' : l === 'fr' ? 'Français' : l === 'de' ? 'Deutsch' : 'العربية'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="flex flex-col sm:items-end gap-3 flex-shrink-0">
              {/* Instant WebAssembly Badge with Hollow Shadow */}
              <div className="relative">
                <div className="absolute inset-0 border-2 border-slate-900 rounded-full translate-x-1 translate-y-1 -z-10 bg-transparent" />
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 text-slate-950 rounded-full font-black text-xs uppercase tracking-wider border-2 border-slate-900">
                  {t.instantWasm}
                </div>
              </div>
              <GoogleAuth />
            </div>
          </div>
        </div>

        {/* Dynamic Workspace Container */}
        <div className="flex flex-col gap-10 w-full">
          {/* File Dropzone */}
          <DropZone onFilesSelected={handleAddFiles} lang={lang} />

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
                    {t.queueTitle}
                  </h2>
                  <span className="text-xs font-black text-slate-900 bg-amber-300 border-2 border-slate-900 p-1 px-3 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {files.length} {files.length === 1 ? t.filesCountSingle : t.filesCountPlural}
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
                      <span>{t.convertAll} ({idleCount})</span>
                    </button>
                  )}

                  {completedCount > 0 && (
                    <button
                      onClick={handleDownloadAllCompleted}
                      className="flex items-center gap-2 p-2.5 px-5 text-xs font-bold text-slate-900 bg-indigo-300 hover:bg-indigo-200 border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.downloadAll} ({completedCount})</span>
                    </button>
                  )}

                  <button
                    onClick={handleClearAll}
                    disabled={isBulkConverting}
                    className="flex items-center gap-2 p-2.5 px-5 text-xs font-bold text-slate-700 bg-rose-100 hover:bg-rose-200 border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.clearAll}</span>
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
                      onUpdateTargetLanguage={handleUpdateTargetLanguage}
                      onStartConversion={startConversion}
                      onRemove={handleRemoveFile}
                      onPreview={(itm) => setPreviewItem(itm)}
                      onSummarizePdf={(itm) => setSelectedPdfItem(itm)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* History Panel */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-[12px_12px_0px_0px_rgba(245,158,11,1)] flex flex-col gap-6"
              id="conversion-history-container"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-slate-900 pb-5 gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {t.historyTitle}
                  </h2>
                  <span className="text-xs font-black text-slate-900 bg-amber-300 border-2 border-slate-900 p-1 px-3 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {history.length}
                  </span>
                </div>

                <button
                  onClick={() => setHistory([])}
                  className="flex items-center gap-2 p-2 px-4 text-xs font-bold text-slate-700 bg-rose-100 hover:bg-rose-200 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearHistory}</span>
                </button>
              </div>

              {/* History Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-xs font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">{t.historyOriginal}</th>
                      <th className="py-3 px-4">{t.historyConverted}</th>
                      <th className="py-3 px-4">{t.historySize}</th>
                      <th className="py-3 px-4">{t.historyDate}</th>
                      <th className="py-3 px-4">{t.historyStatus}</th>
                      <th className="py-3 px-4 text-right">{t.historyAction}</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                    {history.map((item) => {
                      const isSessionActive = !!sessionBlobs[item.id];
                      return (
                        <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                          <td className="py-4 px-4 font-black text-slate-900 max-w-[200px] truncate" title={item.originalName}>
                            {item.originalName}
                          </td>
                          <td className="py-4 px-4 text-indigo-600 max-w-[200px] truncate" title={item.convertedName}>
                            {item.convertedName}
                          </td>
                          <td className="py-4 px-4 text-slate-500">
                            {formatBytes(item.size)}
                          </td>
                          <td className="py-4 px-4 text-slate-500">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({new Date(item.timestamp).toLocaleDateString()})
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {item.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 p-1 px-2.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                {t.historySessionBadge}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 p-1 px-2.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                {t.historyFailed}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {item.status === 'completed' && isSessionActive ? (
                              <a
                                href={sessionBlobs[item.id].url}
                                download={sessionBlobs[item.id].name}
                                className="inline-flex items-center gap-1.5 p-1.5 px-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer font-black text-[10px] uppercase"
                              >
                                <Download className="w-3 h-3" />
                                <span>{t.downloadAgain}</span>
                              </a>
                            ) : item.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-400 border border-slate-200 p-1 px-2.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                {t.historyPastBadge}
                              </span>
                            ) : (
                              <span className="text-rose-500 text-[10px] uppercase tracking-wide font-black" title={item.error}>
                                {item.error || 'ERROR'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
              <h3 className="text-base font-black text-slate-900 tracking-tight">{t.privateTitle}</h3>
              <p className="text-xs text-slate-600 font-bold mt-1.5 leading-relaxed">
                {t.privateDesc}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex gap-4 hover:-translate-y-1 transition-transform">
            <div className="p-3 bg-emerald-200 border-2 border-slate-900 rounded-xl h-fit shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Zap className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">{t.instantTitle}</h3>
              <p className="text-xs text-slate-600 font-bold mt-1.5 leading-relaxed">
                {t.instantDesc}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex gap-4 hover:-translate-y-1 transition-transform">
            <div className="p-3 bg-indigo-200 border-2 border-slate-900 rounded-xl h-fit shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">{t.previewTitle}</h3>
              <p className="text-xs text-slate-600 font-bold mt-1.5 leading-relaxed">
                {t.previewDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <div className="text-center py-4">
        </div>
      </div>

      {/* Footer ticker banner */}
      <footer className="bg-slate-900 text-white border-t-4 border-slate-900 py-6 px-12 overflow-hidden mt-10">
        <div className="max-w-5xl mx-auto flex items-center justify-center">
          <p className="text-xs font-bold text-slate-400">
            © 2026 SWIFT.SHIFT.
          </p>
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

      {/* AI PDF Summarizer Side Panel */}
      <AiPdfSummarizer
        files={files}
        lang={lang}
        selectedPdfItem={selectedPdfItem}
        onClearSelectedPdf={() => setSelectedPdfItem(null)}
        onAddFiles={handleAddFiles}
      />
    </div>
  );
}
