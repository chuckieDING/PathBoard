import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MARKERS_DIR = path.join(process.cwd(), '..', 'pathology-learning', 'markers');

export async function GET() {
  try {
    const files = fs.readdirSync(MARKERS_DIR).filter(f => f.endsWith('.md'));
    const markers = files.map(file => {
      const content = fs.readFileSync(path.join(MARKERS_DIR, file), 'utf-8');
      const slug = file.replace('.md', '');
      return { slug, content };
    });
    return NextResponse.json(markers);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
