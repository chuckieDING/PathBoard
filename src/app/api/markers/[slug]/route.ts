import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MARKERS_DIR = path.join(process.cwd(), '..', 'pathology-learning', 'markers');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const filePath = path.join(MARKERS_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ slug, content });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
