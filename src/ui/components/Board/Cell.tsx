import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DIGITS } from '../../../domain/types';
import type { Cell as CellModel, CellIndex, Digit } from '../../../domain/types';
import { colOf, rowOf } from '../../../domain/board';
import { useTheme } from '../../theme/ThemeProvider';
import { FAST_MODE_ACCENT } from '../../theme/themes';

interface Props {
  cell: CellModel;
  index: CellIndex;
  selected: boolean;
  inPeer: boolean;
  sameValue: boolean;
  /** The currently active digit — its matching note is emphasized. */
  activeValue: Digit | null;
  /** Fast Mode shows the matching note inside a blue square for visibility. */
  fastMode: boolean;
  mistake: boolean;
  /** Bumps to blink this cell's value red twice (conflict feedback). */
  flashNonce: number;
  onPress: (index: CellIndex) => void;
}

function CellComponent({
  cell,
  index,
  selected,
  inPeer,
  sameValue,
  activeValue,
  fastMode,
  mistake,
  flashNonce,
  onPress,
}: Props) {
  const theme = useTheme();
  const c = theme.colors;

  const r = rowOf(index);
  const col = colOf(index);

  let background = c.surface;
  if (sameValue) background = c.sameValue;
  if (inPeer) background = c.highlight;
  if (selected) background = c.selected;
  if (mistake) background = c.errorBg;

  // Bold separators between 3x3 boxes.
  const borderStyle = {
    borderTopWidth: r % 3 === 0 ? 2 : StyleSheet.hairlineWidth,
    borderLeftWidth: col % 3 === 0 ? 2 : StyleSheet.hairlineWidth,
    borderRightWidth: col === 8 ? 2 : 0,
    borderBottomWidth: r === 8 ? 2 : 0,
    borderTopColor: r % 3 === 0 ? c.gridLineBold : c.gridLine,
    borderLeftColor: col % 3 === 0 ? c.gridLineBold : c.gridLine,
    borderRightColor: c.gridLineBold,
    borderBottomColor: c.gridLineBold,
  };

  const valueColor = selected
    ? '#FFFFFF'
    : mistake
      ? c.error
      : cell.given
        ? c.text
        : c.userValue;

  // Blink the value red twice (~1s) when flagged as a conflict culprit.
  const flash = useSharedValue(0);
  useEffect(() => {
    if (flashNonce === 0) return;
    flash.value = withSequence(
      withTiming(1, { duration: 250 }),
      withTiming(0, { duration: 250 }),
      withTiming(1, { duration: 250 }),
      withTiming(0, { duration: 250 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashNonce]);

  const valueAnim = useAnimatedStyle(() => ({
    color: interpolateColor(flash.value, [0, 1], [valueColor, c.error]),
  }));

  return (
    <Pressable
      onPress={() => onPress(index)}
      style={[styles.cell, { backgroundColor: background }, borderStyle]}
    >
      {cell.value !== null ? (
        <Animated.Text style={[styles.value, valueAnim]}>{cell.value}</Animated.Text>
      ) : cell.notes.size > 0 ? (
        <View style={styles.notes}>
          {DIGITS.map((d) => {
            const has = cell.notes.has(d);
            const activeNote = has && d === activeValue;
            return (
              <View key={d} style={styles.noteSlot}>
                {fastMode && activeNote ? (
                  <View style={[styles.noteBadge, { backgroundColor: FAST_MODE_ACCENT }]}>
                    <Text style={styles.noteBadgeText}>{d}</Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.note,
                      activeNote && styles.noteActive,
                      {
                        color: activeNote
                          ? c.primary
                          : selected
                            ? 'rgba(255,255,255,0.85)'
                            : c.note,
                        opacity: has ? 1 : 0,
                      },
                    ]}
                  >
                    {d}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 26, fontWeight: '400' },
  notes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    padding: 1,
  },
  noteSlot: {
    width: '33.33%',
    height: '33.33%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { fontSize: 9, textAlign: 'center' },
  noteActive: { fontWeight: '800' },
  noteBadge: {
    width: '88%',
    aspectRatio: 1,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
});

export const Cell = React.memo(CellComponent);
