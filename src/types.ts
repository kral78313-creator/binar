export type FileStatus = 'idle' | 'converting' | 'completed' | 'failed';

export interface ConvertedResult {
  id: string;
  originalName: string;
  name: string;
  url: string; // Object URL or Data URL for downloading
  blob: Blob;
  size: number;
  type: string;
  extension: string;
  timestamp: number;
  previewContent?: string; // Markdown, JSON, Text, or HTML table for spreadsheet
  multipleFiles?: { name: string; url: string; blob: Blob; size: number }[]; // For PDF -> multiple PNGs
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  extension: string;
  status: FileStatus;
  progress: number;
  error?: string;
  targetFormat?: string;
  targetLanguage?: string;
  convertedResult?: ConvertedResult;
}

export interface FormatOption {
  value: string;
  label: string;
  category: 'image' | 'pdf' | 'spreadsheet' | 'text';
}

export const SUPPORTED_INPUTS = {
  image: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'],
  pdf: ['.pdf'],
  spreadsheet: ['.xlsx', '.xls', '.csv'],
  text: ['.txt', '.md', '.json', '.html', '.xml', '.rtf', '.docx', '.pptx'],
  media: ['.mp3', '.mp4', '.wav']
};

export const CONVERSION_MAP: Record<string, string[]> = {
  // Image sources
  'png': ['jpg', 'webp', 'pdf', 'gif', 'bmp', 'mp4'],
  'jpg': ['png', 'webp', 'pdf', 'gif', 'bmp', 'mp4'],
  'jpeg': ['png', 'webp', 'pdf', 'gif', 'bmp', 'mp4'],
  'webp': ['png', 'jpg', 'pdf', 'gif', 'bmp'],
  'gif': ['png', 'jpg', 'webp', 'pdf', 'mp4'],
  'bmp': ['png', 'jpg', 'webp', 'pdf'],
  
  // PDF sources
  'pdf': ['png', 'jpg', 'txt', 'docx', 'pptx'],
  
  // Spreadsheet sources
  'xlsx': ['pdf', 'csv', 'json', 'html', 'xml'],
  'xls': ['pdf', 'csv', 'json', 'html', 'xml'],
  'csv': ['xlsx', 'pdf', 'json', 'html', 'xml'],
  
  // Text sources
  'txt': ['pdf', 'md', 'html', 'json', 'xml', 'rtf', 'docx', 'pptx'],
  'md': ['pdf', 'html', 'txt', 'rtf', 'docx', 'pptx'],
  'json': ['csv', 'xlsx', 'txt', 'xml', 'docx', 'pptx'],
  'html': ['pdf', 'md', 'txt', 'rtf', 'docx', 'pptx'],
  'xml': ['json', 'csv', 'txt', 'docx', 'pptx'],
  'rtf': ['txt', 'pdf', 'html', 'docx', 'pptx'],
  'docx': ['pdf', 'txt', 'html'],
  'pptx': ['pdf', 'txt'],

  // Media sources
  'mp4': ['mp3', 'gif'],
  'mp3': ['wav', 'm4a', 'mp4'],
  'wav': ['mp3', 'mp4']
};

export const FORMAT_LABELS: Record<string, string> = {
  png: 'PNG Image',
  jpg: 'JPEG Image',
  jpeg: 'JPEG Image',
  webp: 'WebP Image',
  gif: 'GIF Image',
  bmp: 'BMP Image',
  pdf: 'PDF Document',
  xlsx: 'Excel Spreadsheet (.xlsx)',
  xls: 'Excel Spreadsheet (.xls)',
  csv: 'CSV Table',
  json: 'JSON Data',
  txt: 'Plain Text',
  md: 'Markdown Document',
  html: 'HTML File',
  xml: 'XML Document',
  rtf: 'Rich Text Format (.rtf)',
  docx: 'Word Document (.docx)',
  pptx: 'PowerPoint Slide Deck (.pptx)',
  mp3: 'MP3 Audio',
  mp4: 'MP4 Video',
  wav: 'WAV Lossless Audio',
  m4a: 'M4A High-Quality Audio'
};
