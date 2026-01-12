import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Simple chat route called');
    const { messages, userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      message: 'Chat route is working!',
      received: { messages, userId }
    });
  } catch (error) {
    console.error('Error in simple chat route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}