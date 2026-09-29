import { NextRequest, NextResponse } from 'next/server';
import { verifyFileSignature } from '../security/file-signature';
import { isClosetImageMime, type ClosetImageMime } from './storage';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const NO_STORE = { 'Cache-Control': 'private, no-store' };

export type ImageUpload = { buffer: Buffer; contentType: ClosetImageMime };

/**
 * 從 FormData 的 file 欄位讀出一張圖並驗證（格式、大小、檔頭）。
 * 不合格時回 400 的 NextResponse，呼叫端直接 return 它。
 */
export async function readImageUpload(req: NextRequest): Promise<ImageUpload | NextResponse> {
  let file: File | null;
  try {
    file = (await req.formData()).get('file') as File | null;
  } catch {
    return NextResponse.json({ error: 'Invalid request format' }, { status: 400, headers: NO_STORE });
  }
  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400, headers: NO_STORE });
  }
  if (!isClosetImageMime(file.type)) {
    return NextResponse.json({ error: '只支援 JPG、PNG、WebP' }, { status: 400, headers: NO_STORE });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: '圖片不能超過 10MB' }, { status: 400, headers: NO_STORE });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!verifyFileSignature(buffer, file.type).valid) {
    return NextResponse.json({ error: '檔案內容與格式不符' }, { status: 400, headers: NO_STORE });
  }
  return { buffer, contentType: file.type };
}
