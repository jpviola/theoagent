import { NextRequest, NextResponse } from 'next/server';

let cachedDefaultVoiceId: string | null = null;
let cachedDefaultVoiceIdAt = 0;
const DEFAULT_VOICE_TTL_MS = 15 * 60 * 1000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getOptionalIntEnv(name: string): number | null {
  const raw = (process.env[name] || '').trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

async function resolveDefaultVoiceId(apiKey: string): Promise<{ voiceId: string | null; debug?: string }> {
  const now = Date.now();
  if (cachedDefaultVoiceId && (now - cachedDefaultVoiceIdAt) < DEFAULT_VOICE_TTL_MS) {
    return { voiceId: cachedDefaultVoiceId };
  }

  const fetchVoices = async (voiceType?: string) => {
    const url = new URL('https://api.elevenlabs.io/v2/voices');
    url.searchParams.set('page_size', '10');
    url.searchParams.set('include_total_count', 'false');
    if (voiceType) url.searchParams.set('voice_type', voiceType);

    const upstream = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '');
      const msg = `ElevenLabs voices request failed (${upstream.status})`;
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`${msg}: ${body || '(no body)'}`);
      }
      throw new Error(msg);
    }

    const data = await upstream.json().catch(() => null) as any;
    return Array.isArray(data?.voices) ? data.voices : [];
  };

  // Prefer a user-selected/saved voice if available, otherwise fall back to defaults.
  const attempts: Array<string | undefined> = ['saved', 'default', undefined];
  let lastError: string | undefined;
  for (const voiceType of attempts) {
    try {
      const voices = await fetchVoices(voiceType);
      const firstVoiceId = (voices[0]?.voice_id && typeof voices[0].voice_id === 'string')
        ? voices[0].voice_id
        : null;
      if (firstVoiceId) {
        cachedDefaultVoiceId = firstVoiceId;
        cachedDefaultVoiceIdAt = now;
        return { voiceId: firstVoiceId };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  cachedDefaultVoiceId = null;
  cachedDefaultVoiceIdAt = now;
  return { voiceId: null, debug: lastError };
}

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, modelId, outputFormat } = await request.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required', code: 'INVALID_TEXT' },
        { status: 400 }
      );
    }

    const apiKey = requireEnv('ELEVENLABS_API_KEY');

    const maxChars = getOptionalIntEnv('ELEVENLABS_TTS_MAX_CHARS') ?? 1200;
    if (text.length > maxChars) {
      return NextResponse.json(
        {
          error: `Text too long for TTS (max ${maxChars} chars)`,
          code: 'TTS_TEXT_TOO_LONG',
        },
        { status: 400 }
      );
    }
    let resolvedVoiceId =
      (typeof voiceId === 'string' && voiceId.trim())
        ? voiceId.trim()
        : (process.env.ELEVENLABS_VOICE_ID || '').trim();

    if (!resolvedVoiceId) {
      const fallback = await resolveDefaultVoiceId(apiKey);
      if (!fallback.voiceId) {
        const missingVoicesRead = typeof fallback.debug === 'string'
          && fallback.debug.includes('missing_permissions')
          && fallback.debug.includes('voices_read');

        return NextResponse.json(
          {
            error: missingVoicesRead
              ? 'ElevenLabs API key is missing voices_read permission (set ELEVENLABS_VOICE_ID or enable voices_read)'
              : 'Could not resolve a default ElevenLabs voice (set ELEVENLABS_VOICE_ID or pass voiceId)',
            code: 'VOICE_RESOLUTION_FAILED',
            details: process.env.NODE_ENV === 'development' ? fallback.debug : undefined,
          },
          { status: 503 }
        );
      }
      resolvedVoiceId = fallback.voiceId;
    }

    const resolvedModelId =
      (typeof modelId === 'string' && modelId.trim())
        ? modelId.trim()
        : (process.env.ELEVENLABS_TTS_MODEL_ID || 'eleven_multilingual_v2');

    const resolvedOutputFormat =
      (typeof outputFormat === 'string' && outputFormat.trim())
        ? outputFormat.trim()
        : (process.env.ELEVENLABS_TTS_OUTPUT_FORMAT || 'mp3_44100_128');

    const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(resolvedVoiceId)}`);
    url.searchParams.set('output_format', resolvedOutputFormat);

    const upstream = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: resolvedModelId,
      }),
    });

    if (!upstream.ok) {
      const detailsText = await upstream.text().catch(() => '');
      let providerStatus: string | undefined;
      let providerMessage: string | undefined;
      try {
        const parsed = JSON.parse(detailsText);
        providerStatus = parsed?.detail?.status;
        providerMessage = parsed?.detail?.message;
      } catch {
        // ignore
      }

      const isQuotaExceeded = providerStatus === 'quota_exceeded';
      const responseStatus = isQuotaExceeded ? 402 : upstream.status;

      return NextResponse.json(
        {
          error: isQuotaExceeded
            ? 'ElevenLabs quota exceeded for this API key'
            : 'ElevenLabs TTS request failed',
          providerStatus,
          providerMessage,
          details: process.env.NODE_ENV === 'development' ? detailsText : undefined,
          status: upstream.status,
          code: isQuotaExceeded ? 'TTS_QUOTA_EXCEEDED' : 'TTS_UPSTREAM_ERROR',
        },
        { status: responseStatus }
      );
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';

    return new NextResponse(arrayBuffer, {
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isConfig = message.startsWith('Missing ');

    return NextResponse.json(
      {
        error: isConfig ? message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' && !isConfig ? message : undefined,
        code: isConfig ? 'CONFIG_ERROR' : 'TTS_ERROR',
      },
      { status: isConfig ? 503 : 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ElevenLabs TTS proxy',
  });
}
