import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    error: 'Test RAG functionality temporarily disabled during deployment',
    status: 'maintenance'
  }, { status: 503 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'Test RAG functionality temporarily disabled during deployment',
    status: 'maintenance'
  }, { status: 503 })
}