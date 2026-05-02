import React from 'react';
import { PracticeHistoryItem } from '../types';
import { formatDistanceToNow } from '../utils/timeUtils';

interface HistoryItemProps {
  item: PracticeHistoryItem;
}

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const getScoreClasses = (s: number) => {
    if (s >= 85) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (s >= 60) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  return (
    <div
      className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full border text-lg font-bold ${getScoreClasses(score)}`}
    >
      {score}
    </div>
  );
};

export const HistoryItem: React.FC<HistoryItemProps> = ({ item }) => {
  return (
    <li className="bg-slate-700/50 p-4 rounded-lg flex items-center gap-4">
      <ScoreBadge score={item.feedback.score} />
      <div className="flex-1">
        <p className="font-medium text-slate-200">"{item.phrase}"</p>
        <p className="text-xs text-slate-400 mt-1">
          {formatDistanceToNow(item.timestamp)}
        </p>
      </div>
    </li>
  );
};