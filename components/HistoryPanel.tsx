import React from 'react';
import { PracticeHistoryItem } from '../types';
import { HistoryItem } from './HistoryItem';
import { HistoryIcon } from './icons/HistoryIcon';

interface HistoryPanelProps {
  history: PracticeHistoryItem[];
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <HistoryIcon className="w-6 h-6 text-sky-300" />
        <h3 className="text-lg font-semibold text-sky-300">Practice History</h3>
      </div>
      {history.length === 0 ? (
        <p className="text-center text-slate-500 bg-slate-700/50 py-4 rounded-lg">
          Your practice attempts will appear here.
        </p>
      ) : (
        <ul className="space-y-4">
          {history.map((item, index) => (
            <HistoryItem key={index} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
};