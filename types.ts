
export type Player = 'X' | 'O' | null;
export type GameState = Player[][][]; // 3x3x3 grid

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';
export type View = 'home' | 'playing' | 'settings' | 'how-to-play';

export interface WinInfo {
  winner: Player;
  line: [number, number, number][]; // Array of [x, y, z] coordinates
}

export interface Position {
  x: number;
  y: number;
  z: number;
}
