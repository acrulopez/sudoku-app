/**
 * Derived view-state helpers. Kept as plain functions over a board/selection so
 * components can compute exactly what they need and minimize re-renders.
 */
import { getPeers, getConflicts } from '../domain/rules';
import { DIGITS } from '../domain/types';
import type { Board, CellIndex, Digit } from '../domain/types';

/** How many of each digit are placed (1-9) — drives the pad's remaining count. */
export function remainingCounts(board: Board): Record<Digit, number> {
  const placed: Record<number, number> = {};
  for (const d of DIGITS) placed[d] = 0;
  for (const cell of board) {
    if (cell.value !== null) placed[cell.value]++;
  }
  const remaining: Record<number, number> = {};
  for (const d of DIGITS) remaining[d] = Math.max(0, 9 - placed[d]);
  return remaining as Record<Digit, number>;
}

export interface Highlights {
  peers: Set<CellIndex>;
  sameValue: Set<CellIndex>;
  conflicts: Set<CellIndex>;
}

/**
 * Cells to tint: peers of the selection, cells sharing the selected/active
 * value, and all conflicting cells. (Matching pencil notes are emphasized per
 * note digit in the Cell, not by tinting the whole cell.)
 */
export function computeHighlights(
  board: Board,
  selectedIndex: CellIndex | null,
  activeValue: Digit | null,
): Highlights {
  const peers = selectedIndex !== null ? new Set(getPeers(selectedIndex)) : new Set<CellIndex>();

  // The value we highlight matches: an explicitly active digit (Fast Mode) or
  // the value sitting in the selected cell.
  const value =
    activeValue ?? (selectedIndex !== null ? board[selectedIndex].value : null);
  const sameValue = new Set<CellIndex>();
  if (value !== null) {
    board.forEach((cell, i) => {
      if (cell.value === value) sameValue.add(i);
    });
  }

  return { peers, sameValue, conflicts: getConflicts(board) };
}

/**
 * Cells whose user-entered value disagrees with the puzzle solution. Distinct
 * from peer conflicts: a wrong value can be unique among its peers yet still be
 * a mistake. Returns an empty set when the solution is unknown (resumed games).
 */
export function computeMistakes(board: Board, solution: string): Set<CellIndex> {
  const mistakes = new Set<CellIndex>();
  if (!solution) return mistakes;
  board.forEach((cell, i) => {
    if (cell.value !== null && !cell.given && solution[i] !== String(cell.value)) {
      mistakes.add(i);
    }
  });
  return mistakes;
}
