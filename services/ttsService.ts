/**
 * Finds the best available English voice from the browser's speech synthesis API.
 * It prioritizes higher-quality, server-side voices and specific known good voices.
 * @param voices An array of SpeechSynthesisVoice objects.
 * @returns The best-matched voice, or null if no English voices are found.
 */
function findBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
    if (englishVoices.length === 0) return null;

    // 1. Prioritize non-local (server-side, often higher quality) voices
    const premiumVoice = englishVoices.find(v => !v.localService);
    if (premiumVoice) return premiumVoice;

    // 2. Look for specific high-quality voices by name
    const googleUS = englishVoices.find(v => v.name.includes('Google') && v.lang === 'en-US');
    if (googleUS) return googleUS;

    const naturalMicrosoft = englishVoices.find(v => v.name.includes('Microsoft') && v.name.includes('Natural'));
    if (naturalMicrosoft) return naturalMicrosoft;

    // 3. Fallback to any US English voice
    const anyUS = englishVoices.find(v => v.lang === 'en-US');
    if (anyUS) return anyUS;
    
    // 4. Fallback to the very first English voice
    return englishVoices[0];
}

/**
 * A helper to ensure voices are loaded before trying to use them,
 * as the `getVoices()` API can be asynchronous.
 * @returns A promise that resolves with an array of available voices.
 */
function getLoadedVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }
        window.speechSynthesis.onvoiceschanged = () => {
            resolve(window.speechSynthesis.getVoices());
            window.speechSynthesis.onvoiceschanged = null; // Clean up listener
        };
    });
}


/**
 * Converts text to speech using the browser's Web Speech API, automatically selecting a high-quality English voice.
 * @param text The plain text to synthesize.
 * @returns A promise that resolves when speech is finished, or rejects on error.
 */
export function textToSpeech(text: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            return reject(new Error("Your browser does not support the Web Speech API."));
        }

        try {
            // Cancel any ongoing speech to prevent overlap
            window.speechSynthesis.cancel();
            
            const availableVoices = await getLoadedVoices();
            const utterance = new SpeechSynthesisUtterance(text);
            const bestVoice = findBestVoice(availableVoices);

            if (bestVoice) {
                utterance.voice = bestVoice;
            } else if (availableVoices.length === 0) {
                // This case is unlikely if the browser supports the API, but good to handle.
                console.warn('No voices available for speech synthesis. The browser will use its default.');
            } else {
                console.warn('No suitable English voice found. Using browser default.');
            }

            utterance.onend = () => {
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('SpeechSynthesis Error', event);
                reject(new Error(`Speech synthesis failed: ${event.error}`));
            };

            // Small delay to ensure cancel() has completed on some browsers
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 100);
        } catch (error) {
             console.error("Error setting up speech synthesis:", error);
             reject(new Error("Could not initialize speech synthesis."));
        }
    });
}