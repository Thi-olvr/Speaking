import { VoiceOption } from '../types';

const API_BASE_URL = 'https://api.elevenlabs.io/v1';

// Custom Error class to include status code
export class ApiError extends Error {
    public status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

interface ElevenLabsVoiceResponse {
    voices: {
        voice_id: string;
        name: string;
        category: string;
        labels: {
            accent?: string;
            description?: string;
            age?: string;
            gender?: string;
        };
    }[];
}

export async function getElevenLabsVoices(apiKey: string): Promise<VoiceOption[]> {
    if (!apiKey) {
        return [];
    }
    const response = await fetch(`${API_BASE_URL}/voices`, {
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) {
        throw new ApiError(`Failed to fetch ElevenLabs voices.`, response.status);
    }

    const data: ElevenLabsVoiceResponse = await response.json();

    // Filter for English voices, as non-English voices are not relevant for this app.
    // This logic assumes that voices without an accent label or with a US/GB/AU accent are suitable.
    const englishVoices = data.voices.filter(voice => 
        voice.labels.accent && ['american', 'british', 'australian'].includes(voice.labels.accent)
    );

    return englishVoices.map((voice): VoiceOption => ({
        id: voice.voice_id,
        name: voice.name,
        lang: 'en', // All ElevenLabs voices used here are English
        displayName: `[ElevenLabs] ${voice.name}`,
        service: 'elevenlabs',
    }));
}

export function elevenLabsTextToSpeech(text: string, voiceId: string, apiKey: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        if (!apiKey) {
            return reject(new Error("ElevenLabs API key not provided."));
        }

        try {
            const response = await fetch(`${API_BASE_URL}/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                      stability: 0.5,
                      similarity_boost: 0.5,
                    },
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ detail: { message: response.statusText } }));
                const message = `ElevenLabs API error: ${errorBody.detail?.message || response.statusText}`;
                throw new ApiError(message, response.status);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
            };

            audio.onerror = (e) => {
                URL.revokeObjectURL(audioUrl);
                console.error("Error playing ElevenLabs audio:", e);
                reject(new Error("Failed to play the generated audio."));
            };

            audio.play();

        } catch (error) {
            console.error("Error with ElevenLabs TTS request:", error);
            reject(error);
        }
    });
}