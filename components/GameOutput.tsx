
import React, { useEffect, useRef } from 'react';
import { GameLogEntry } from '../types.ts';

interface GameOutputProps {
  log: GameLogEntry[];
  isLoading: boolean;
}

const GameOutput: React.FC<GameOutputProps> = ({ log, isLoading }) => {
  const endOfLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const getTextColor = (type: GameLogEntry['type']) => {
    switch (type) {
      case 'player':
        return 'text-green-300';
      case 'error':
        return 'text-red-400';
      case 'info':
        return 'text-yellow-400';
      case 'combat':
        return 'text-cyan-300';
      case 'enemy_turn':
        return 'text-orange-400';
      case 'system':
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="flex-grow p-4 md:p-6 overflow-y-auto text-xl md:text-2xl leading-relaxed">
      {log.map((entry) => (
        <div key={entry.id} className={`whitespace-pre-wrap ${getTextColor(entry.type)}`}>
          {entry.type === 'player' && <span className="text-green-500 mr-2">&gt;</span>}
          {entry.text}
        </div>
      ))}
      {isLoading && (
        <div className="text-green-400 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400 mr-3"></div>
            Procesando...
        </div>
      )}
      <div ref={endOfLogRef} />
    </div>
  );
};

export default GameOutput;