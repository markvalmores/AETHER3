
import React, { useState, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Canvas } from '@react-three/fiber';
import Scene from './3d';
import Game2D from './2d';
import AnimeBackground from './anime';
import { INITIAL_STATE, checkWinner, getAiMove } from './gameLogic';
import { Player, GameState, WinInfo, View, Difficulty } from './types';

const socket = io(); // Connects to the host that serves the page

// Helper component for styled buttons.
interface MenuButtonProps {
  children?: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}

const MenuButton = ({ children, onClick, primary }: MenuButtonProps) => (
  <button 
    onClick={onClick}
    className={`w-full py-4 px-8 rounded-2xl font-black tracking-[0.2em] text-sm transition-all active:scale-95 shadow-lg border ${
      primary 
        ? 'bg-pink-500 border-pink-400 text-white hover:bg-pink-400 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]' 
        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20'
    }`}
  >
    {children}
  </button>
);

// Helper component for displaying active player status.
const PlayerTab = ({ active, symbol, color, label }: { active: boolean, symbol: string, color: 'sky' | 'pink', label: string }) => (
  <div className={`flex flex-col items-center px-4 py-1.5 rounded-xl transition-all duration-500 ${active ? `bg-${color}-500/10 shadow-inner` : 'opacity-20 grayscale'}`}>
    <span className={`text-[8px] font-black tracking-widest mb-0.5 ${active ? (color === 'sky' ? 'text-sky-400' : 'text-pink-400') : 'text-slate-500'}`}>{label}</span>
    <span className={`text-xl font-black ${active ? (color === 'sky' ? 'text-sky-400' : 'text-pink-400') : 'text-slate-500'}`}>{symbol}</span>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [grid, setGrid] = useState<GameState>(INITIAL_STATE);
  const [currentPlayer, setCurrentPlayer] = useState<Exclude<Player, null>>('X');
  const [winInfo, setWinInfo] = useState<WinInfo | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [is2DMode, setIs2DMode] = useState(false);
  const [stats, setStats] = useState({ activePlayers: 1, totalGamersJoined: 1 });

  useEffect(() => {
    socket.on('statsUpdate', (newStats) => {
      setStats(newStats);
    });

    return () => {
      socket.off('statsUpdate');
    };
  }, []);

  const makeMove = useCallback((x: number, y: number, z: number) => {
    if (grid[x][y][z] || winInfo || isDraw) return;

    const newGrid = JSON.parse(JSON.stringify(grid)) as GameState;
    newGrid[x][y][z] = currentPlayer;
    setGrid(newGrid);

    const winner = checkWinner(newGrid);
    if (winner) {
      setWinInfo(winner);
    } else {
      const isFull = newGrid.every(plane => 
        plane.every(row => 
          row.every(cell => cell !== null)
        )
      );
      if (isFull) {
        setIsDraw(true);
      } else {
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      }
    }
  }, [grid, currentPlayer, winInfo, isDraw]);

  useEffect(() => {
    if (view === 'playing' && isAiEnabled && currentPlayer === 'O' && !winInfo && !isDraw) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const move = getAiMove(grid, 'O', difficulty);
        if (move) {
          makeMove(move[0], move[1], move[2]);
        }
        setIsAiThinking(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, isAiEnabled, grid, winInfo, isDraw, makeMove, view, difficulty]);

  const startNewGame = () => {
    setGrid(INITIAL_STATE);
    setWinInfo(null);
    setIsDraw(false);
    setCurrentPlayer('X');
    setIsAiThinking(false);
    setView('playing');
  };

  const refreshBackground = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Rendering logic for different views
  const renderHome = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto z-10">
      <div className="flex flex-col items-center gap-12 text-center animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col">
          <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] leading-none">
            AETHER<span className="text-pink-500 drop-shadow-[0_0_20px_rgba(236,72,153,0.7)]">3</span>
          </h1>
          <p className="text-xs md:text-sm uppercase tracking-[0.6em] text-slate-400 font-bold mt-4">Multidimensional Battle</p>
        </div>

        <div className="flex flex-col gap-4 w-64">
          <MenuButton onClick={startNewGame} primary>ENTER ARENA</MenuButton>
          <MenuButton onClick={() => setView('how-to-play')}>HOW TO PLAY</MenuButton>
          <MenuButton onClick={() => setView('settings')}>PROTOCOLS</MenuButton>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-20">
      <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
        <h2 className="text-3xl font-black italic text-white mb-8 tracking-tighter">PROTOCOLS</h2>
        
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black tracking-widest text-slate-400 uppercase">AI Entity</span>
              <button 
                onClick={() => setIsAiEnabled(!isAiEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isAiEnabled ? 'bg-pink-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isAiEnabled ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>
            {isAiEnabled && (
              <div className="space-y-3">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Intelligence Level</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['EASY', 'NORMAL', 'HARD'] as Difficulty[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-2 rounded-lg text-[10px] font-black tracking-widest transition-all border ${difficulty === d ? 'bg-pink-500 border-pink-400 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Default Perspective</span>
              <button 
                onClick={() => setIs2DMode(!is2DMode)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-slate-200 uppercase hover:bg-white/10"
              >
                {is2DMode ? '2D SLICE' : '3D CORE'}
              </button>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/5">
            <MenuButton onClick={() => setView('home')}>RETURN TO COMMAND</MenuButton>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHowToPlay = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-20">
       <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500 max-h-[80vh] overflow-y-auto">
        <h2 className="text-3xl font-black italic text-white mb-6 tracking-tighter">BATTLE INTEL</h2>
        <div className="space-y-6 text-slate-300">
          <section>
            <h3 className="text-pink-500 font-black text-xs uppercase tracking-widest mb-2">The Dimension</h3>
            <p className="text-sm leading-relaxed">Unlike standard matches, AETHER3 occurs in a 3x3x3 grid. This creates 27 possible cells across 3 layers of depth.</p>
          </section>
          <section>
            <h3 className="text-pink-500 font-black text-xs uppercase tracking-widest mb-2">Victory Conditions</h3>
            <p className="text-sm leading-relaxed">Align three of your markers in a sequence. Sequences can be:</p>
            <ul className="list-disc list-inside mt-2 text-xs space-y-1 opacity-80">
              <li>Horizontal (Across a row)</li>
              <li>Vertical (Down a column)</li>
              <li>Depth (Across planes)</li>
              <li>2D Diagonals (Across a face)</li>
              <li>3D Diagonals (From corner to opposing opposite corner)</li>
            </ul>
          </section>
          <section>
            <h3 className="text-pink-500 font-black text-xs uppercase tracking-widest mb-2">Perspectives</h3>
            <p className="text-sm leading-relaxed">Switch between 3D Core and 2D Slice mode at any time using the toggle in the header. 2D Slice shows the three planes of the cube separately.</p>
          </section>
          <div className="pt-4 border-t border-white/5">
            <MenuButton onClick={() => setView('home')}>UNDERSTOOD</MenuButton>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGameUI = () => (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-10 z-10">
      <header className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col cursor-pointer" onClick={() => setView('home')}>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white leading-none">
            AETHER<span className="text-pink-500">3</span>
          </h1>
          <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mt-1">Live Arena</span>
        </div>
        
        <div className="flex flex-col gap-3 items-end">
          <div className="flex items-center gap-3">
            {/* Perspective Toggle */}
            <button 
              onClick={() => setIs2DMode(!is2DMode)}
              className="px-4 py-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl text-[10px] font-black tracking-widest text-pink-400 uppercase shadow-2xl hover:bg-slate-800 transition-colors"
            >
              {is2DMode ? 'GO 3D' : 'GO 2D'}
            </button>
            <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-2 rounded-2xl shadow-2xl">
              <PlayerTab active={currentPlayer === 'X'} symbol="X" color="sky" label="CORE-X" />
              <div className="w-[1px] h-8 bg-white/10 mx-1"></div>
              <PlayerTab active={currentPlayer === 'O'} symbol="O" color="pink" label={isAiEnabled ? "UNIT-O" : "VOID-O"} />
            </div>
          </div>
          <button 
            onClick={refreshBackground}
            className="p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-slate-300 transition-all active:scale-90 group"
          >
            <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {(winInfo || isDraw) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-slate-950/80 backdrop-blur-3xl border border-white/10 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 pointer-events-auto transform animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-2">
              <span className="text-xs font-black tracking-[0.4em] text-pink-500 uppercase">Dimension Resolved</span>
              <h2 className="text-5xl md:text-7xl font-black text-white italic drop-shadow-2xl">
                {winInfo ? `${winInfo.winner} TRIUMPHS` : "STALEMATE"}
              </h2>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={startNewGame}
                className="group relative w-full py-5 bg-pink-500 hover:bg-pink-400 text-white rounded-full font-black tracking-widest text-lg transition-all active:scale-95 shadow-[0_0_30px_rgba(236,72,153,0.4)]"
              >
                NEW BATTLE
              </button>
              <button 
                onClick={() => setView('home')}
                className="w-full py-4 text-xs font-black tracking-[0.3em] text-slate-400 hover:text-white uppercase"
              >
                MAIN COMMAND
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="flex justify-center pointer-events-auto">
        {!winInfo && !isDraw ? (
          <div className="flex flex-col items-center gap-4">
            <div className="px-10 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex items-center gap-4">
               <div className={`w-3 h-3 rounded-full ${isAiThinking ? 'bg-pink-400 animate-ping' : currentPlayer === 'X' ? 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]' : 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]'}`}></div>
               <span className="text-sm font-black tracking-[0.2em] text-slate-200 uppercase">
                 {isAiThinking ? "UNIT-O CALCULATING..." : `Active: ${currentPlayer === 'X' ? 'CORE-X' : isAiEnabled ? 'UNIT-O' : 'VOID-O'}`}
               </span>
            </div>
          </div>
        ) : null}
      </footer>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans select-none">
      {/* Global Anime Background - Now visible in both 2D and 3D modes for consistent atmosphere */}
      {backgroundUrl && (
        <div 
          className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out bg-cover bg-center pointer-events-none"
          style={{ 
            backgroundImage: `url(${backgroundUrl})`,
            opacity: 0.35,
            filter: is2DMode ? 'blur(20px) brightness(0.7)' : 'none'
          }}
        />
      )}

      {/* 3D Game Perspective */}
      <div className={`absolute inset-0 z-10 transition-opacity duration-1000 ${is2DMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {!is2DMode && (
          <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
            <Scene 
              grid={grid} 
              onCellClick={(x, y, z) => view === 'playing' && !isAiThinking && makeMove(x, y, z)} 
              winInfo={winInfo} 
              isDraw={isDraw}
              backgroundUrl={null} // Scene background handled by global layer now
            />
          </Canvas>
        )}
      </div>

      {/* 2D Game Perspective */}
      {is2DMode && view === 'playing' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6 pt-24 pb-32 overflow-y-auto">
          <Game2D 
            grid={grid} 
            onCellClick={(x, y, z) => !isAiThinking && makeMove(x, y, z)} 
            winInfo={winInfo}
            isAiThinking={isAiThinking}
          />
        </div>
      )}

      {/* Global Realtime Stats */}
      <div className="absolute bottom-6 left-6 z-30 pointer-events-none flex flex-col gap-2">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Active Entities</span>
            <span className="text-sm font-bold text-emerald-400 leading-none">{stats.activePlayers}</span>
          </div>
        </div>
        
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="flex h-3 w-3 items-center justify-center">
            <span className="inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Total Joins</span>
            <span className="text-sm font-bold text-pink-400 leading-none">{stats.totalGamersJoined}</span>
          </div>
        </div>
      </div>

      {/* UI Layers */}
      {view === 'home' && renderHome()}
      {view === 'settings' && renderSettings()}
      {view === 'how-to-play' && renderHowToPlay()}
      {view === 'playing' && renderGameUI()}

      <AnimeBackground 
        key={refreshKey}
        onBackgroundLoaded={setBackgroundUrl} 
        gameStatus={
          view === 'home' ? "Beautiful cosmic anime landscape peaceful" :
          winInfo ? `Epic victory anime scene ${winInfo.winner}` : 
          isDraw ? "Gloomy cosmic stalemate" : 
          isAiEnabled ? "Technological tactical battle display" : "Intense anime duel"
        } 
      />

      {/* Visual Textures & Vignette */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.6)_100%)]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>
    </div>
  );
};

export default App;
