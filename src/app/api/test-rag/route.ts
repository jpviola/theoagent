import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    error: 'Test RAG functionality temporarily disabled during deployment',
    status: 'maintenance'
  }, { status: 503 })
}

export async function POST() {
  return NextResponse.json({
    error: 'Test RAG functionality temporarily disabled during deployment',
    status: 'maintenance'
  }, { status: 503 })
}
