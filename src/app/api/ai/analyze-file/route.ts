import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { extractTextFromFile, saveUploadedFile } from '@/lib/file-parser';
import { analyzeDocumentContent } from '@/lib/ai-service';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let text = '';
    let fileName = 'Uploaded Document';
    let hintType = 'DOCUMENT';
    let fileInfo: any = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      hintType = (formData.get('hintType') as string) || 'DOCUMENT';

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
      }

      fileName = file.name;
      const saved = await saveUploadedFile(file);
      fileInfo = {
        fileUrl: saved.publicUrl,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
      };

      text = await extractTextFromFile(file, saved.buffer);
    } else {
      const body = await req.json();
      text = body.text || '';
      fileName = body.fileName || 'Direct Text Input';
      hintType = body.hintType || 'DOCUMENT';
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Document text content is empty' }, { status: 400 });
    }

    const userRec = await prisma.user.findUnique({ where: { id: user.id } });
    const analysis = await analyzeDocumentContent(text, fileName, hintType, userRec?.customApiKey);

    return NextResponse.json({
      success: true,
      analysis,
      extractedTextSnippet: text.slice(0, 1000),
      rawTextLength: text.length,
      fileInfo,
    });
  } catch (error) {
    console.error('Error analyzing file content:', error);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}
