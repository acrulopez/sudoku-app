import { createBoard, indexOf, boardToString } from './board';
import { isValidPlacement, getConflicts, getPeers } from './rules';
import { candidatesFor } from './candidates';
import {
  placeValue,
  toggleNote,
  eraseCell,
  applyAutoNotes,
  isSolved,
} from './engine';
import { createHistory, pushMove, undo, redo } from './history';
import type { Board, Digit } from './types';

// A known puzzle's unique solution.
const SOLUTION =
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

// Pad givens to 81 chars defensively (the literal above is illustrative length).
function pad(s: string): string {
  return (s + '.'.repeat(81)).slice(0, 81);
}

const PUZZLE = pad(
  '53..7....6..195....098000060800006000034008003001700002000060000419005000080007900',
);

describe('board', () => {
  it('coordinate helpers', () => {
    expect(indexOf(0, 0)).toBe(0);
    expect(indexOf(8, 8)).toBe(80);
    expect(indexOf(4, 4)).toBe(40);
  });

  it('createBoard marks givens', () => {
    const b = createBoard(pad('53'));
    expect(b[0].value).toBe(5);
    expect(b[0].given).toBe(true);
    expect(b[2].value).toBeNull();
    expect(b[2].given).toBe(false);
  });
});

describe('rules', () => {
  it('peers count is 20', () => {
    expect(getPeers(0).size).toBe(20);
    expect(getPeers(40).size).toBe(20);
  });

  it('isValidPlacement detects row/col/box conflicts', () => {
    const b = createBoard(pad('5'));
    // 5 is at index 0 (row0/col0/box0). Cannot place 5 in same row.
    expect(isValidPlacement(b, indexOf(0, 5), 5)).toBe(false);
    // same column
    expect(isValidPlacement(b, indexOf(5, 0), 5)).toBe(false);
    // same box
    expect(isValidPlacement(b, indexOf(1, 1), 5)).toBe(false);
    // unrelated cell is fine
    expect(isValidPlacement(b, indexOf(8, 8), 5)).toBe(true);
  });

  it('a solved board has zero conflicts', () => {
    const b = createBoard(SOLUTION);
    expect(getConflicts(b).size).toBe(0);
  });
});

describe('placeValue', () => {
  it('places a value and clears notes', () => {
    let b: Board = createBoard(pad(''));
    const noted = toggleNote(b, 0, 3 as Digit)!;
    b = noted.board;
    expect(b[0].notes.has(3)).toBe(true);
    const placed = placeValue(b, 0, 7 as Digit)!;
    expect(placed.board[0].value).toBe(7);
    expect(placed.board[0].notes.size).toBe(0);
  });

  it('placing the same value clears the cell', () => {
    const b = createBoard(pad(''));
    const first = placeValue(b, 0, 7 as Digit)!;
    const second = placeValue(first.board, 0, 7 as Digit)!;
    expect(second.board[0].value).toBeNull();
  });

  it('refuses to edit a given', () => {
    const b = createBoard(pad('5'));
    expect(placeValue(b, 0, 7 as Digit)).toBeNull();
  });

  it('does not mutate the original board (immutability)', () => {
    const b = createBoard(pad(''));
    placeValue(b, 0, 7 as Digit);
    expect(b[0].value).toBeNull();
  });

  it('strips the placed value from peer notes when removePeerNotes is set', () => {
    let b: Board = createBoard(pad(''));
    const peer = indexOf(0, 5); // same row as index 0
    const other = indexOf(0, 6);
    b = toggleNote(b, peer, 7 as Digit)!.board;
    b = toggleNote(b, peer, 4 as Digit)!.board;
    b = toggleNote(b, other, 4 as Digit)!.board;

    const placed = placeValue(b, 0, 7 as Digit, true)!;
    // 7 removed from the peer's notes, 4 (unrelated) kept; non-peer untouched.
    expect(placed.board[peer].notes.has(7)).toBe(false);
    expect(placed.board[peer].notes.has(4)).toBe(true);
    expect(placed.board[other].notes.has(4)).toBe(true);

    // One undo restores the peer note alongside the placed value.
    let history = pushMove(createHistory(), placed.move);
    const undone = undo(placed.board, history)!;
    expect(undone.board[0].value).toBeNull();
    expect(undone.board[peer].notes.has(7)).toBe(true);
  });

  it('leaves peer notes alone by default', () => {
    let b: Board = createBoard(pad(''));
    const peer = indexOf(0, 5);
    b = toggleNote(b, peer, 7 as Digit)!.board;
    const placed = placeValue(b, 0, 7 as Digit)!;
    expect(placed.board[peer].notes.has(7)).toBe(true);
  });
});

describe('toggleNote validation', () => {
  it('blocks an illegal note when validation is on', () => {
    const b = createBoard(pad('5')); // 5 at index 0
    // placing note 5 in a peer cell should be blocked
    const res = toggleNote(b, indexOf(0, 3), 5 as Digit, true);
    expect(res).toBeNull();
  });

  it('allows an illegal note when validation is off', () => {
    const b = createBoard(pad('5'));
    const res = toggleNote(b, indexOf(0, 3), 5 as Digit, false);
    expect(res).not.toBeNull();
    expect(res!.board[indexOf(0, 3)].notes.has(5)).toBe(true);
  });

  it('toggles a legal note on and off', () => {
    const b = createBoard(pad(''));
    const on = toggleNote(b, 40, 4 as Digit)!;
    expect(on.board[40].notes.has(4)).toBe(true);
    const off = toggleNote(on.board, 40, 4 as Digit)!;
    expect(off.board[40].notes.has(4)).toBe(false);
  });
});

describe('eraseCell', () => {
  it('clears value and notes but not givens', () => {
    const b = createBoard(pad('5'));
    expect(eraseCell(b, 0)).toBeNull(); // given
    const placed = placeValue(b, 1, 9 as Digit)!;
    const erased = eraseCell(placed.board, 1)!;
    expect(erased.board[1].value).toBeNull();
  });
});

describe('applyAutoNotes (Fast Pencil)', () => {
  it('fills every empty cell with its candidates', () => {
    const b = createBoard(PUZZLE);
    const res = applyAutoNotes(b)!;
    for (let i = 0; i < 81; i++) {
      if (res.board[i].value === null) {
        const expected = candidatesFor(b, i);
        expect([...res.board[i].notes].sort()).toEqual(expected.sort());
      }
    }
  });
});

describe('isSolved', () => {
  it('true only for the exact solution', () => {
    expect(isSolved(createBoard(SOLUTION), SOLUTION)).toBe(true);
    expect(isSolved(createBoard(PUZZLE), SOLUTION)).toBe(false);
  });
});

describe('history undo/redo', () => {
  it('round-trips a single move', () => {
    let board = createBoard(pad(''));
    let history = createHistory();
    const res = placeValue(board, 0, 7 as Digit)!;
    board = res.board;
    history = pushMove(history, res.move);
    expect(board[0].value).toBe(7);

    const undone = undo(board, history)!;
    expect(undone.board[0].value).toBeNull();

    const redone = redo(undone.board, undone.history)!;
    expect(redone.board[0].value).toBe(7);
  });

  it('undoes a batched Fast Pencil move in one step', () => {
    let board = createBoard(PUZZLE);
    let history = createHistory();
    const before = boardToString(board);
    const res = applyAutoNotes(board)!;
    board = res.board;
    history = pushMove(history, res.move);
    const undone = undo(board, history)!;
    // values unchanged by auto-notes; notes restored to empty
    expect(boardToString(undone.board)).toBe(before);
    for (let i = 0; i < 81; i++) {
      expect(undone.board[i].notes.size).toBe(0);
    }
  });

  it('a new move clears the redo stack', () => {
    let board = createBoard(pad(''));
    let history = createHistory();
    const a = placeValue(board, 0, 1 as Digit)!;
    history = pushMove(history, a.move);
    const u = undo(a.board, history)!;
    const b = placeValue(u.board, 5, 2 as Digit)!;
    history = pushMove(u.history, b.move);
    expect(history.future).toHaveLength(0);
  });
});
