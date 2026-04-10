import { NextResponse } from 'next/server';
import { getNote } from '@/lib/pathology';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ system: string; disease: string }> }
) {
  try {
    const { system, disease } = await params;
    const note = await getNote(system, disease);
    if (!note) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    // rawContent is a large field, ensure it's included
    const response = { ...note };
    return NextResponse.json(response, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load note', details: String(e) }, { status: 500 });
  }
}
