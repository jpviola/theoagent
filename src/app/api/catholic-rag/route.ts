import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'RAG functionality temporarily disabled during deployment',
    status: 'maintenance'
  }, { status: 503 })
}