import { NextResponse } from 'next/server';
import { getMarkerDiseaseMap } from '@/lib/pathology';

export async function GET() {
  try {
    const map = await getMarkerDiseaseMap();
    return NextResponse.json(map);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load marker-disease map', details: String(e) }, { status: 500 });
  }
}
