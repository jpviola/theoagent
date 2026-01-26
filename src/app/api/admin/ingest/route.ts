import { NextResponse } from 'next/server';
import { ingestVaticanNews } from '@/lib/ingestion/rss-service';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  // Check Admin Session
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');

  if (!adminSession) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await ingestVaticanNews();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal Server Error during ingestion' },
      { status: 500 }
    );
  }
}
