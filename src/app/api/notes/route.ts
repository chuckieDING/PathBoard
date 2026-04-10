import { NextResponse } from 'next/server';
import { getAllNotes } from '@/lib/pathology';

export async function GET() {
  try {
    const notes = await getAllNotes();
    return NextResponse.json(notes);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load notes', details: String(e) }, { status: 500 });
  }
}
