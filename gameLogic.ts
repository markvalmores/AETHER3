
import { GameState, WinInfo, Difficulty } from './types';

export const INITIAL_STATE: GameState = Array(3).fill(null).map(() => 
  Array(3).fill(null).map(() => 
    Array(3).fill(null)
  )
);

export function getAllLines(): [number, number, number][][] {
  const size = 3;
  const lines: [number, number, number][][] = [];

  // 1. Rows (9), Columns (9), Depth (9)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      lines.push([[0, i, j], [1, i, j], [2, i, j]]);
      lines.push([[i, 0, j], [i, 1, j], [i, 2, j]]);
      lines.push([[i, j, 0], [i, j, 1], [i, j, 2]]);
    }
  }

  // 2. 2D Diagonals on each face
  for (let i = 0; i < size; i++) {
    lines.push([[0, 0, i], [1, 1, i], [2, 2, i]]);
    lines.push([[0, 2, i], [1, 1, i], [2, 0, i]]);
    lines.push([[0, i, 0], [1, i, 1], [2, i, 2]]);
    lines.push([[0, i, 2], [1, i, 1], [2, i, 0]]);
    lines.push([[i, 0, 0], [i, 1, 1], [i, 2, 2]]);
    lines.push([[i, 0, 2], [i, 1, 1], [i, 2, 0]]);
  }

  // 3. 3D Space Diagonals
  lines.push([[0, 0, 0], [1, 1, 1], [2, 2, 2]]);
  lines.push([[2, 0, 0], [1, 1, 1], [0, 2, 2]]);
  lines.push([[0, 2, 0], [1, 1, 1], [2, 0, 2]]);
  lines.push([[0, 0, 2], [1, 1, 1], [2, 2, 0]]);

  return lines;
}

export function checkWinner(grid: GameState): WinInfo | null {
  const lines = getAllLines();
  for (const line of lines) {
    const [[x1, y1, z1], [x2, y2, z2], [x3, y3, z3]] = line;
    const p1 = grid[x1][y1][z1];
    if (p1 && p1 === grid[x2][y2][z2] && p1 === grid[x3][y3][z3]) {
      return { winner: p1, line };
    }
  }
  return null;
}

export function getAiMove(grid: GameState, aiPlayer: 'X' | 'O', difficulty: Difficulty): [number, number, number] | null {
  const opponent = aiPlayer === 'X' ? 'O' : 'X';
  const lines = getAllLines();
  const emptyCells: [number, number, number][] = [];

  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      for (let z = 0; z < 3; z++) {
        if (!grid[x][y][z]) emptyCells.push([x, y, z]);
      }
    }
  }

  if (emptyCells.length === 0) return null;

  let smartProb = 0.8;
  if (difficulty === 'EASY') smartProb = 0.4;
  if (difficulty === 'HARD') smartProb = 1.0;

  const isSmart = Math.random() < smartProb;

  if (isSmart) {
    // 1. Win
    for (const line of lines) {
      const players = line.map(([x, y, z]) => grid[x][y][z]);
      const aiCount = players.filter(p => p === aiPlayer).length;
      const nullCount = players.filter(p => p === null).length;
      if (aiCount === 2 && nullCount === 1) {
        return line[players.indexOf(null)];
      }
    }

    // 2. Block
    for (const line of lines) {
      const players = line.map(([x, y, z]) => grid[x][y][z]);
      const opponentCount = players.filter(p => p === opponent).length;
      const nullCount = players.filter(p => p === null).length;
      if (opponentCount === 2 && nullCount === 1) {
        return line[players.indexOf(null)];
      }
    }
  }

  // Strategy: Prefer center or corners
  const center: [number, number, number] = [1, 1, 1];
  if (!grid[1][1][1]) return center;

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
}
