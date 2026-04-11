import { NextResponse } from 'next/server';
import { getAllLiterature } from '@/lib/pathology';

export async function GET() {
  try {
    const literature = await getAllLiterature();
    return NextResponse.json(literature);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load literature', details: String(e) }, { status: 500 });
  }
}
