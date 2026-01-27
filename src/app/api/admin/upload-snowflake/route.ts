import { NextResponse } from 'next/server';
import { uploadToSnowflake } from '@/lib/snowflake-client';

export async function POST() {
  try {
    const result = await uploadToSnowflake();
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Internal Server Error: ' + error.message },
      { status: 500 }
    );
  }
}
