import { NextRequest, NextResponse } from 'next/server';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    const apiKey = requireEnv('ELEVENLABS_API_KEY');

    const tokenType = 'realtime_scribe';
    const upstream = await fetch(`https://api.elevenlabs.io/v1/single-use-token/${tokenType}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!upstream.ok) {
      const details = await upstream.text().catch(() => '');
      return NextResponse.json(
        {
          error: 'Failed to create ElevenLabs single-use token',
          details: process.env.NODE_ENV === 'development' ? details : undefined,
          status: upstream.status,
        },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    const modelId = process.env.NEXT_PUBLIC_ELEVENLABS_STT_MODEL_ID || 'scribe_v2_realtime';

    return NextResponse.json({
      token: data.token,
      modelId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isConfig = message.startsWith('Missing ');

    return NextResponse.json(
      {
        error: isConfig ? message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' && !isConfig ? message : undefined,
        code: isConfig ? 'CONFIG_ERROR' : 'TOKEN_ERROR',
      },
      { status: isConfig ? 503 : 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ElevenLabs single-use token',
  });
}
