export enum RecordingStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
}

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Feedback {
  score: number;
  positiveFeedback: string;
  improvementTip: string;
  userTranscription: string;
  mispronouncedWords: string[];
}

// FIX: Add missing PracticeHistoryItem type used by HistoryPanel and HistoryItem.
export interface PracticeHistoryItem {
  phrase: string;
  feedback: Feedback;
  timestamp: Date;
}

// FIX: Added missing VoiceOption type for voice selection.
export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  displayName: string;
  service: 'webspeech' | 'elevenlabs';
}

export interface WordMeaning {
  partOfSpeech: string;
  shortMeaning: string;
  definition: string;
  exampleSentence: string;
  visualSceneDescription: string;
}

export interface WordAnalysis {
    meanings: WordMeaning[];
    phrasalVerbs: (WordMeaning & { expression: string })[];
    collocations: (WordMeaning & { expression: string })[];
    idioms: (WordMeaning & { expression: string })[];
}

export interface ComprehensiveWordData {
    ankiCardHtml: string;
    imageData: WordAnalysis;
}