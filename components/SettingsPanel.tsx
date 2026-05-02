import React from 'react';
import { VoiceOption } from '../types';
import { SettingsIcon } from './icons/SettingsIcon';

interface SettingsPanelProps {
  voices: VoiceOption[];
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  isLoading: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  voices, 
  selectedVoice, 
  onVoiceChange, 
  isLoading, 
}) => {
  return (
    <div className="bg-slate-800/50 p-4 rounded-xl shadow-lg border border-slate-700">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-sky-300" />
            <label htmlFor="voice-select" className="font-semibold text-slate-300 text-sm">
                Voice Selection
            </label>
        </div>
        <div className="flex-1">
          <select
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => onVoiceChange(e.target.value)}
            disabled={isLoading || voices.length === 0}
            className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <option>Loading voices...</option>
            ) : voices.length === 0 ? (
                <option>No English voices found</option>
            ) : (
              voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.displayName}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </div>
  );
};