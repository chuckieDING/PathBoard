import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LITERATURE_BASE = '/root/.openclaw/workspace/pathology-learning/literature';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params;
  const filePath = path.join(LITERATURE_BASE, ...pathParts);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(filePath).map(f => ({
      name: f,
      size: fs.statSync(path.join(filePath, f)).size,
    }));
    return NextResponse.json({ files });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.xml': 'application/xml',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
  };
  const ct = contentTypes[ext] || 'application/octet-stream';

  return new NextResponse(fs.readFileSync(filePath), {
    headers: {
      'Content-Type': ct,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
