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
  text: ['.txt', '.md', '.json', '.html']
};

export const CONVERSION_MAP: Record<string, string[]> = {
  // Image sources
  'png': ['jpg', 'webp', 'pdf', 'gif', 'bmp'],
  'jpg': ['png', 'webp', 'pdf', 'gif', 'bmp'],
  'jpeg': ['png', 'webp', 'pdf', 'gif', 'bmp'],
  'webp': ['png', 'jpg', 'pdf', 'gif', 'bmp'],
  'gif': ['png', 'jpg', 'webp', 'pdf'],
  'bmp': ['png', 'jpg', 'webp', 'pdf'],
  
  // PDF sources
  'pdf': ['png', 'jpg', 'txt'],
  
  // Spreadsheet sources
  'xlsx': ['pdf', 'csv', 'json', 'html'],
  'xls': ['pdf', 'csv', 'json', 'html'],
  'csv': ['xlsx', 'pdf', 'json', 'html'],
  
  // Text sources
  'txt': ['pdf', 'md', 'html'],
  'md': ['pdf', 'html', 'txt'],
  'json': ['csv', 'xlsx', 'txt'],
  'html': ['pdf', 'md', 'txt']
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
  html: 'HTML File'
};
