import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "Basic test endpoint working",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    success: true, 
    message: "POST request working",
    query: "Test response",
    response: "This is a simple test response without any complex processing.",
    responseTime: 50,
    timestamp: new Date().toISOString()
  });
}