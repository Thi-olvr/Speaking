import React from 'react';
import { Difficulty } from '../types';
import { BarChartIcon } from './icons/BarChartIcon';

interface DifficultySelectorProps {
  currentDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  disabled: boolean;
}

const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({ currentDifficulty, onDifficultyChange, disabled }) => {
  return (
    <div className="bg-slate-800/50 p-4 rounded-xl shadow-lg border border-slate-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <BarChartIcon className="w-5 h-5 text-sky-300" />
          <h3 className="font-semibold text-slate-300 text-sm">
            Difficulty Level
          </h3>
        </div>
        <div className="flex-1 w-full grid grid-cols-3 gap-2">
          {difficulties.map((level) => (
            <button
              key={level}
              onClick={() => onDifficultyChange(level)}
              disabled={disabled}
              className={`w-full text-sm font-semibold py-2 px-3 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                currentDifficulty === level
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
