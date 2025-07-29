import { NextResponse } from 'next/server';
import axios from 'axios';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export async function POST(request: Request) {
  try {
    const { text, voiceId, voiceSettings } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Default voice settings
    const settings = {
      stability: voiceSettings?.stability || 0.5,
      similarity_boost: voiceSettings?.similarityBoost || 0.75,
      style: voiceSettings?.style || 0,
      use_speaker_boost: voiceSettings?.useSpeakerBoost || true,
    };

    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId || '21m00Tcm4TlvDq8ikWAM'}`, // Default to Rachel voice
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: settings,
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    // Convert audio to base64
    const audioBase64 = Buffer.from(response.data).toString('base64');

    return NextResponse.json({
      audio: `data:audio/mpeg;base64,${audioBase64}`,
      settings,
    });
  } catch (error: any) {
    console.error('Error generating voice:', error.response?.data || error);
    return NextResponse.json(
      { error: 'Failed to generate voice' },
      { status: 500 }
    );
  }
}

// Get available voices
export async function GET() {
  try {
    const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    const voices = response.data.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      labels: voice.labels,
      preview_url: voice.preview_url,
      category: voice.category,
    }));

    return NextResponse.json({ voices });
  } catch (error) {
    console.error('Error fetching voices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}