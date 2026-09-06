import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface ExtractedFileContent {
  rawText: string;
  fileType: string;
  fileSize: number;
  fileName: string;
  savedPath: string;
  publicUrl: string;
}

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function ensureUploadsDir(): Promise<void> {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating uploads directory:', err);
  }
}

export async function saveUploadedFile(file: File): Promise<{ fileName: string; savedPath: string; publicUrl: string; buffer: Buffer }> {
  await ensureUploadsDir();

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || '.bin';
  const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const finalFileName = `${baseName}-${uniqueSuffix}${ext}`;
  const savedPath = path.join(UPLOADS_DIR, finalFileName);

  await fs.writeFile(savedPath, buffer);

  const publicUrl = `/uploads/${finalFileName}`;
  return { fileName: finalFileName, savedPath, publicUrl, buffer };
}

export async function extractTextFromFile(
  file: File,
  buffer: Buffer
): Promise<string> {
  const mimeType = file.type || '';
  const ext = path.extname(file.name).toLowerCase();

  // 1. Text, Markdown, JSON, CSV, Log
  if (
    mimeType.startsWith('text/') ||
    ['.txt', '.md', '.json', '.csv', '.log', '.html', '.xml', '.ts', '.js', '.py'].includes(ext)
  ) {
    try {
      return buffer.toString('utf-8');
    } catch (e) {
      console.warn('Failed to parse text buffer as utf-8:', e);
    }
  }

  // 2. PDF Documents
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      if (data && data.text && data.text.trim().length > 0) {
        return data.text.trim();
      }
    } catch (e) {
      console.warn('pdf-parse error (fallback to binary heuristic):', e);
    }
    // Fallback printable text extraction for PDFs
    const printable = buffer.toString('latin1').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    const cleaned = printable.replace(/\s+/g, ' ').trim();
    if (cleaned.length > 50) return cleaned.slice(0, 10000);
  }

  // 3. Images (JPEG, PNG, WEBP, SVG)
  if (mimeType.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
    return `[Image Document: ${file.name}, Size: ${(file.size / 1024).toFixed(1)} KB. Stored as visual archive asset.]`;
  }

  // 4. Generic binary or docx
  try {
    const raw = buffer.toString('utf-8');
    const printableOnly = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    if (printableOnly.length > 30) {
      return printableOnly.slice(0, 8000);
    }
  } catch {}

  return `Document archive item: ${file.name} (${file.type || 'unknown type'})`;
}

export async function deleteUploadedFile(fileUrl?: string | null): Promise<void> {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
  try {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(UPLOADS_DIR, fileName);
    await fs.unlink(filePath);
  } catch (err) {
    console.warn('Could not delete file from storage:', fileUrl, err);
  }
}
