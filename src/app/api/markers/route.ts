import { NextResponse } from 'next/server';
import { getAllMarkers } from '@/lib/pathology';

export async function GET() {
  try {
    const markers = await getAllMarkers();
    return NextResponse.json(markers);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
