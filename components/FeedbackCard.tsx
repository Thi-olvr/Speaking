import React from 'react';
import { Feedback } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { QuoteIcon } from './icons/QuoteIcon';
import { AnkiIcon } from './icons/AnkiIcon';
import { ImageIcon } from './icons/ImageIcon';

interface FeedbackCardProps {
  feedback: Feedback | null;
  isLoading: boolean;
  onCreateAnkiCard: (word: string) => void;
  onGenerateImage: (word: string, context: string) => void;
  phrase: string;
}

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-slate-600 rounded w-3/4"></div>
        <div className="h-4 bg-slate-600 rounded w-full"></div>
        <div className="h-4 bg-slate-600 rounded w-5/6"></div>
        <div className="h-4 bg-slate-600 rounded w-1/2"></div>
    </div>
);

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
  
    const getScoreColor = (s: number) => {
      if (s >= 85) return 'stroke-green-400';
      if (s >= 60) return 'stroke-yellow-400';
      return 'stroke-red-400';
    };
    
    const getTextColor = (s: number) => {
      if (s >= 85) return 'fill-green-400';
      if (s >= 60) return 'fill-yellow-400';
      return 'fill-red-400';
    };
  
    return (
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            className="stroke-slate-700"
            strokeWidth="8"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
          <circle
            className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dy=".3em"
            className={`text-3xl font-bold ${getTextColor(score)}`}
          >
            {score}
          </text>
        </svg>
      </div>
    );
  };

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback, isLoading, onCreateAnkiCard, onGenerateImage, phrase }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
        <h3 className="text-lg font-semibold text-sky-300 mb-4">Analyzing Your Pronunciation...</h3>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
      <h3 className="text-lg font-semibold text-sky-300 mb-4">AI Feedback</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <ScoreCircle score={feedback.score} />
        <div className="flex-1 space-y-4 w-full">
            <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <h4 className="font-semibold text-slate-200">What Went Well</h4>
                </div>
                <p className="text-slate-300 pl-9">{feedback.positiveFeedback}</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                    <LightbulbIcon className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                    <h4 className="font-semibold text-slate-200">Tip for Improvement</h4>
                </div>
                <p className="text-slate-300 pl-9">{feedback.improvementTip}</p>
            </div>
            {feedback.userTranscription && (
                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <QuoteIcon className="w-6 h-6 text-purple-400 flex-shrink-0" />
                        <h4 className="font-semibold text-slate-200">What the AI Heard</h4>
                    </div>
                    <div className="text-slate-300 pl-9 text-lg tracking-wide">
                        {feedback.userTranscription.split(' ').map((word, index) => {
                            const cleanedWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
                            const isMispronounced = feedback.mispronouncedWords.some(
                                mispronounced => mispronounced.toLowerCase() === cleanedWord
                            );
                            return (
                                <span key={index} className="inline-block mr-1 leading-loose">
                                    <span className={isMispronounced ? 'text-yellow-300 underline decoration-wavy decoration-red-500/70' : ''}>
                                        {word}
                                    </span>
                                    {isMispronounced && (
                                        <>
                                            <button 
                                                onClick={() => onCreateAnkiCard(cleanedWord)}
                                                className="inline-flex items-center gap-1.5 bg-sky-800/50 hover:bg-sky-700/70 text-sky-200 text-xs font-semibold px-2 py-1 rounded-md ml-1 transition-colors transform-gpu active:scale-95"
                                                title={`Create Anki card for "${cleanedWord}"`}
                                            >
                                                <AnkiIcon className="w-3 h-3" />
                                                Gerar Anki Card
                                            </button>
                                            <button 
                                                onClick={() => onGenerateImage(cleanedWord, phrase)}
                                                className="inline-flex items-center gap-1.5 bg-purple-800/60 hover:bg-purple-700/80 text-purple-200 text-xs font-semibold px-2 py-1 rounded-md ml-1 transition-colors transform-gpu active:scale-95"
                                                title={`Generate flashcard for "${cleanedWord}"`}
                                            >
                                                <ImageIcon className="w-3 h-3" />
                                                Gerar Flashcard
                                            </button>
                                        </>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};