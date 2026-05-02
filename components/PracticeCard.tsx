import React, { useState } from 'react';
import { RecordingStatus } from '../types';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';
import { SoundIcon } from './icons/SoundIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface PracticeCardProps {
  phrase: string;
  onListen: () => Promise<void>;
  onGetFeedback: () => void;
  isFeedbackLoading: boolean;
  isPhraseLoading: boolean;
  recordingStatus: RecordingStatus;
  audioURL: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
  onNewPhrase: () => void;
}

export const PracticeCard: React.FC<PracticeCardProps> = ({ 
  phrase,
  onListen,
  onGetFeedback, 
  isFeedbackLoading, 
  isPhraseLoading,
  recordingStatus,
  audioURL,
  startRecording,
  stopRecording,
  resetRecording,
  onNewPhrase
}) => {
  const [isListening, setIsListening] = useState(false);

  const handleListenClick = async () => {
    if (phrase && !isPhraseLoading && !isListening) {
      setIsListening(true);
      try {
        await onListen();
      } catch (error) {
        // Error is handled by the App component, which displays a banner.
        // We just log it here for debugging. The alert is removed for better UX.
        console.error('TTS Error (handled by App):', error);
      } finally {
        setIsListening(false);
      }
    }
  };


  const handleRecordClick = () => {
    if (recordingStatus === RecordingStatus.RECORDING) {
      stopRecording();
    } else {
      resetRecording();
      startRecording();
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
      <div className="relative mb-6 pb-6 border-b border-slate-700">
        {isPhraseLoading ? (
          <div className="h-16 bg-slate-700 animate-pulse rounded-md mx-auto max-w-md"></div>
        ) : (
          <p className="text-2xl font-medium text-slate-100 min-h-[4rem] flex items-center justify-center text-center px-10">
            "{phrase}"
          </p>
        )}
        <button
          onClick={onNewPhrase}
          disabled={isPhraseLoading}
          className="absolute top-1/2 -translate-y-1/2 right-0 text-slate-400 hover:text-sky-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
          aria-label="Get new phrase"
        >
          <RefreshIcon className={`w-6 h-6 ${isPhraseLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Step 1: Listen */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-400 mb-2">STEP 1</span>
          <button
            onClick={handleListenClick}
            disabled={isPhraseLoading || isListening}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-full transition-all duration-200 w-32"
          >
            {isListening ? (
                <>
                    <RefreshIcon className="w-5 h-5 animate-spin" />
                    <span>Playing...</span>
                </>
            ) : (
                <>
                    <SoundIcon className="w-5 h-5" />
                    <span>Listen</span>
                </>
            )}
          </button>
        </div>

        {/* Step 2: Record */}
        <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-400 mb-2">STEP 2</span>
            <button
                onClick={handleRecordClick}
                disabled={isPhraseLoading}
                className={`flex items-center gap-2 font-bold py-2 px-4 rounded-full transition-all duration-200 w-32 justify-center ${
                    recordingStatus === RecordingStatus.RECORDING 
                    ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse-red' 
                    : 'bg-slate-600 hover:bg-slate-500 text-white disabled:bg-slate-700'
                }`}
            >
                {recordingStatus === RecordingStatus.RECORDING ? (
                    <>
                        <StopIcon className="w-5 h-5" />
                        <span>Stop</span>
                    </>
                ) : (
                    <>
                        <MicrophoneIcon className="w-5 h-5" />
                        <span>Record</span>
                    </>
                )}
            </button>
        </div>

        {/* Step 3: Playback */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-400 mb-2">STEP 3</span>
            {audioURL ? (
                <div className="flex items-center gap-2">
                    <audio src={audioURL} controls className="h-10 w-48 custom-audio-player"></audio>
                    <button onClick={resetRecording} className="text-slate-400 hover:text-white transition-colors" aria-label="Reset recording">
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-center h-10 w-56 text-sm text-slate-500 bg-slate-700/50 rounded-lg">
                    Your recording will appear here
                </div>
            )}
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-700 flex flex-col items-center">
        <button
          onClick={onGetFeedback}
          disabled={isFeedbackLoading || isPhraseLoading || !audioURL}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105"
        >
          {isFeedbackLoading ? 'Analyzing...' : 'Get AI Feedback'}
        </button>
      </div>
      <style>{`
        .custom-audio-player::-webkit-media-controls-panel {
          background-color: #334155; /* slate-700 */
        }
        .custom-audio-player::-webkit-media-controls-play-button,
        .custom-audio-player::-webkit-media-controls-current-time-display,
        .custom-audio-player::-webkit-media-controls-time-remaining-display,
        .custom-audio-player::-webkit-media-controls-timeline,
        .custom-audio-player::-webkit-media-controls-volume-slider,
        .custom-audio-player::-webkit-media-controls-mute-button {
          filter: brightness(2);
        }
        @keyframes pulse-red {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
            }
        }
        .animate-pulse-red {
            animation: pulse-red 2s infinite;
        }
      `}</style>
    </div>
  );
};