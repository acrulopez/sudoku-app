import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SIDE } from '../../../domain/board';
import type { Board as BoardModel, CellIndex, Digit } from '../../../domain/types';
import { computeHighlights } from '../../../state/selectors';
import { useTheme } from '../../theme/ThemeProvider';
import { Cell } from './Cell';

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
  onCellPress: (index: CellIndex) => void;
}

export function Board({
  board,
  selectedIndex,
  activeValue,
  mistakes,
  fastMode,
  flashCells,
  onCellPress,
}: Props) {
  const theme = useTheme();
  const { peers, sameValue } = useMemo(
    () => computeHighlights(board, selectedIndex, activeValue),
    [board, selectedIndex, activeValue],
  );

  return (
    <View style={[styles.grid, { borderColor: theme.colors.gridLineBold }]}>
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
                selected={!fastMode && selectedIndex === index}
                inPeer={!fastMode && selectedIndex !== index && peers.has(index)}
                sameValue={sameValue.has(index) && (fastMode || selectedIndex !== index)}
                activeValue={activeValue}
                fastMode={fastMode}
                mistake={mistakes.has(index)}
                flashNonce={flashNonce}
                onPress={onCellPress}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { width: '100%', aspectRatio: 1 },
  row: { flexDirection: 'row', flex: 1 },
});
