import { NextResponse } from 'next/server';
import { getAllGuidelines } from '@/lib/pathology';

export async function GET() {
  try {
    const guidelines = await getAllGuidelines();
    return NextResponse.json(guidelines);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load guidelines', details: String(e) }, { status: 500 });
  }
}
