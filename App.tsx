
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { PracticeCard } from './components/PracticeCard';
import { FeedbackCard } from './components/FeedbackCard';
import { AnkiCardGenerator } from './components/AnkiCardGenerator';
import { ProgrammingCardGenerator } from './components/ProgrammingCardGenerator';
import { VocabularyImageGenerator } from './components/VocabularyImageGenerator';
import { generatePracticePhrase, getPronunciationFeedback } from './services/geminiService';
import { textToSpeech } from './services/ttsService';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { Feedback, Difficulty, PracticeHistoryItem } from './types';
import { DifficultySelector } from './components/DifficultySelector';
import { HistoryPanel } from './components/HistoryPanel';

const App: React.FC = () => {
  const [targetPhrase, setTargetPhrase] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoadingPhrase, setIsLoadingPhrase] = useState<boolean>(true);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ankiWord, setAnkiWord] = useState<string>('');
  const [ankiContext, setAnkiContext] = useState<string>('');
  const [imageWord, setImageWord] = useState<string>('');
  const [imageContext, setImageContext] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [history, setHistory] = useState<PracticeHistoryItem[]>([]);

  const ankiGeneratorRef = useRef<HTMLDivElement>(null);
  const imageGeneratorRef = useRef<HTMLDivElement>(null);

  const { recordingStatus, audioURL, audioBlob, startRecording, stopRecording, resetRecording } = useAudioRecorder();

  const fetchNewPhrase = useCallback(async () => {
    setIsLoadingPhrase(true);
    setFeedback(null);
    setError(null);
    resetRecording();
    try {
      const phrase = await generatePracticePhrase(difficulty);
      setTargetPhrase(phrase);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('QUOTA_EXCEEDED')) {
        setError("You've reached the API rate limit. Please wait a moment before trying again.");
      } else {
        setError('Failed to generate a new phrase. Please check your API key and try again.');
      }
      console.error(err);
    } finally {
      setIsLoadingPhrase(false);
    }
  }, [resetRecording, difficulty]);

  useEffect(() => {
    fetchNewPhrase();
  }, [fetchNewPhrase]);

  const getBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGetFeedback = async () => {
    if (!targetPhrase || !audioBlob) return;
    setIsLoadingFeedback(true);
    setFeedback(null);
    setError(null);
    try {
      const base64Audio = await getBase64(audioBlob);
      const newFeedback = await getPronunciationFeedback(targetPhrase, base64Audio, audioBlob.type);
      setFeedback(newFeedback);

      const historyItem: PracticeHistoryItem = {
        phrase: targetPhrase,
        feedback: newFeedback,
        timestamp: new Date(),
      };
      setHistory(prevHistory => [historyItem, ...prevHistory]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (errorMessage.includes('QUOTA_EXCEEDED')) {
        setError("You've reached the API rate limit. Please wait a moment before trying again.");
      } else {
        setError(`Failed to get feedback. ${errorMessage}`);
      }
      console.error(err);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleCreateAnkiCardForWord = (word: string) => {
    const cleanedWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
    setAnkiWord(cleanedWord);
    setAnkiContext(targetPhrase);
    setTimeout(() => {
      ankiGeneratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleGenerateImageForWord = (word: string, context: string) => {
    const cleanedWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
    setImageWord(cleanedWord);
    setImageContext(context);
    setTimeout(() => {
        imageGeneratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  const handleListen = useCallback(async () => {
      if (!targetPhrase) return;
      setError(null);
      try {
        await textToSpeech(targetPhrase);
      } catch (err) {
         console.error("TTS Error:", err);
         const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
         setError(`Sorry, there was an error playing the audio. ${errorMessage}`);
      }
  }, [targetPhrase]);

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <Header />
      <main className="w-full max-w-2xl mx-auto mt-8 flex flex-col gap-6">
        {error && (
          <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-lg text-center" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <DifficultySelector 
            currentDifficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            disabled={isLoadingPhrase}
        />

        <PracticeCard 
          phrase={targetPhrase}
          onListen={handleListen}
          onGetFeedback={handleGetFeedback} 
          isFeedbackLoading={isLoadingFeedback}
          isPhraseLoading={isLoadingPhrase}
          recordingStatus={recordingStatus}
          audioURL={audioURL}
          startRecording={startRecording}
          stopRecording={stopRecording}
          resetRecording={resetRecording}
          onNewPhrase={fetchNewPhrase}
        />

        <FeedbackCard 
          feedback={feedback} 
          isLoading={isLoadingFeedback} 
          onCreateAnkiCard={handleCreateAnkiCardForWord}
          onGenerateImage={handleGenerateImageForWord}
          phrase={targetPhrase}
        />
        
        <HistoryPanel history={history} />

        <div ref={ankiGeneratorRef}>
          <AnkiCardGenerator 
            wordToGenerate={ankiWord} 
            contextToGenerate={ankiContext} 
          />
        </div>

        <div>
          <ProgrammingCardGenerator />
        </div>
        
        <div ref={imageGeneratorRef}>
            <VocabularyImageGenerator wordToGenerate={imageWord} contextToGenerate={imageContext} />
        </div>
        
      </main>
      <footer className="text-center mt-auto pt-8 text-slate-500 text-sm">
        <p>Powered by Gemini API. Improve your English one phrase at a time.</p>
      </footer>
    </div>
  );
};

export default App;
