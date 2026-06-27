import React, { useMemo, useState } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { SIDE } from '../../../domain/board';
import type { Board as BoardModel, CellIndex, Digit } from '../../../domain/types';
import type { CellAnnotation, ChainLink } from '../../../domain/hints';
import { computeHighlights } from '../../../state/selectors';
import { useTheme } from '../../theme/ThemeProvider';
import { Cell } from './Cell';
import { ChainOverlay } from './ChainOverlay';

interface Props {
  board: BoardModel;
  selectedIndex: CellIndex | null;
  activeValue: Digit | null;
  mistakes: Set<CellIndex>;
  /** In Fast Mode we don't focus a single cell — we light up the active digit
   *  everywhere instead, so the selected-cell / peer tints are suppressed. */
  fastMode: boolean;
  /** Cells to blink red twice (conflict feedback). */
  flashCells: { indices: CellIndex[]; nonce: number } | null;
  /** OS "Reduce Motion" is on — cells skip the conflict blink. */
  reduceMotion: boolean;
  /** Active Smart Hint annotations (cell index -> tint/×/ghost). When present,
   *  normal selection/peer tints are suppressed so the hint reads cleanly. */
  hintAnnotations?: Record<CellIndex, CellAnnotation>;
  /** Chain arrows for the active Smart Hint step, drawn over the grid. */
  chainLinks?: ChainLink[];
  onCellPress: (index: CellIndex) => void;
}

export function Board({
  board,
  selectedIndex,
  activeValue,
  mistakes,
  fastMode,
  flashCells,
  reduceMotion,
  hintAnnotations,
  chainLinks,
  onCellPress,
}: Props) {
  const theme = useTheme();
  const { peers, sameValue } = useMemo(
    () => computeHighlights(board, selectedIndex, activeValue),
    [board, selectedIndex, activeValue],
  );
  const hinting = hintAnnotations !== undefined;
  const [boardSize, setBoardSize] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setBoardSize(e.nativeEvent.layout.width);
  // Snap to an integer, device-pixel-aligned cell size so every row shares the
  // exact same column boundaries (avoids per-row sub-pixel rounding drift that
  // makes the 3x3 separators zigzag).
  const cellSize = boardSize > 0 ? PixelRatio.roundToNearestPixel(boardSize / 9) : 0;
  const gridSize = cellSize * 9;

  return (
    <View
      style={[
        styles.grid,
        { borderColor: theme.colors.gridLineBold },
        cellSize > 0 && { width: gridSize, height: gridSize },
      ]}
      onLayout={onLayout}
    >
      {Array.from({ length: SIDE }).map((_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: SIDE }).map((_, col) => {
            const index = row * SIDE + col;
            const flashNonce =
              flashCells && flashCells.indices.includes(index) ? flashCells.nonce : 0;
            return (
              <Cell
                key={index}
                cell={board[index]}
                index={index}
                selected={!hinting && !fastMode && selectedIndex === index}
                inPeer={!hinting && !fastMode && selectedIndex !== index && peers.has(index)}
                sameValue={!hinting && sameValue.has(index) && (fastMode || selectedIndex !== index)}
                activeValue={hinting ? null : activeValue}
                fastMode={fastMode}
                mistake={!hinting && mistakes.has(index)}
                flashNonce={hinting ? 0 : flashNonce}
                reduceMotion={reduceMotion}
                annotation={hintAnnotations?.[index]}
                cellSize={cellSize}
                onPress={onCellPress}
              />
            );
          })}
        </View>
      ))}
      {chainLinks && chainLinks.length > 0 && cellSize > 0 && (
        <ChainOverlay links={chainLinks} size={gridSize} color={theme.colors.error} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { width: '100%', aspectRatio: 1, alignSelf: 'center' },
  row: { flexDirection: 'row', flex: 1 },
});
