import { NextResponse } from 'next/server';
import { getMarker } from '@/lib/pathology';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const marker = await getMarker(slug);
    if (!marker) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(marker);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
