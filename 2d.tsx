
import React from 'react';
import { GameState, Player, WinInfo } from './types';

interface Game2DProps {
  grid: GameState;
  onCellClick: (x: number, y: number, z: number) => void;
  winInfo: WinInfo | null;
  isAiThinking: boolean;
}

const Game2D: React.FC<Game2DProps> = ({ grid, onCellClick, winInfo, isAiThinking }) => {
  const isWinningCell = (x: number, y: number, z: number) => {
    if (!winInfo) return false;
    return winInfo.line.some(([wx, wy, wz]) => wx === x && wy === y && wz === z);
  };

  const layers = ['TOP LAYER', 'MIDDLE LAYER', 'BOTTOM LAYER'];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {grid.map((plane, x) => (
        <div key={x} className="flex flex-col gap-4">
          <div className="text-center">
            <span className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">{layers[x]}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
            {plane.map((row, y) => 
              row.map((cell, z) => (
                <button
                  key={`${x}-${y}-${z}`}
                  disabled={isAiThinking || !!cell || !!winInfo}
                  onClick={() => onCellClick(x, y, z)}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-3xl font-black transition-all duration-300 border
                    ${isWinningCell(x, y, z) 
                      ? 'bg-pink-500/20 border-pink-500 text-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)] animate-pulse' 
                      : cell === 'X'
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                      : cell === 'O'
                      ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                      : 'bg-slate-800/40 border-white/5 hover:bg-white/10 hover:border-white/20'
                    }
                  `}
                >
                  {cell === 'X' && <span className="drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]">X</span>}
                  {cell === 'O' && <span className="drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">O</span>}
                </button>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Game2D;
