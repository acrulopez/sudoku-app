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

interface Props {
  cell: CellModel;
  index: CellIndex;
  selected: boolean;
  inPeer: boolean;
  sameValue: boolean;
  /** The currently active digit — its matching note is emphasized. */
  activeValue: Digit | null;
  /** Fast Mode shows the matching note inside an accent square for visibility. */
  fastMode: boolean;
  mistake: boolean;
  /** Bumps to blink this cell's value red twice (conflict feedback). */
  flashNonce: number;
  /** OS "Reduce Motion" is on — skip the blink, lean on the static marker. */
  reduceMotion: boolean;
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
  reduceMotion,
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

  // Blink the value red twice (~1s) when flagged as a conflict culprit. Skipped
  // under Reduce Motion — the corner marker carries the error statically.
  const flash = useSharedValue(0);
  useEffect(() => {
    if (flashNonce === 0 || reduceMotion) return;
    flash.value = withSequence(
      withTiming(1, { duration: 250 }),
      withTiming(0, { duration: 250 }),
      withTiming(1, { duration: 250 }),
      withTiming(0, { duration: 250 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashNonce, reduceMotion]);

  const valueAnim = useAnimatedStyle(() => ({
    color: interpolateColor(flash.value, [0, 1], [valueColor, c.error]),
  }));

  // Non-color error cue: a corner flag legible without hue and without motion,
  // so the mistake survives color-blindness and Reduce Motion. (Accessibility
  // floor — see PRODUCT.md.)
  const accentSquare = fastMode ? c.primary : undefined;

  const a11yLabel = buildLabel(r, col, cell, mistake);

  return (
    <Pressable
      onPress={() => onPress(index)}
      style={[styles.cell, { backgroundColor: background }, borderStyle]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected, disabled: cell.given }}
    >
      {mistake && (
        <View
          style={[styles.errorFlag, { borderTopColor: c.error }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}
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
                  <View style={[styles.noteBadge, { backgroundColor: accentSquare }]}>
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

function buildLabel(r: number, col: number, cell: CellModel, mistake: boolean): string {
  const where = `Row ${r + 1}, column ${col + 1}`;
  if (cell.value !== null) {
    const kind = cell.given ? 'given' : mistake ? 'mistake' : 'entered';
    return `${where}, ${cell.value}, ${kind}`;
  }
  if (cell.notes.size > 0) {
    return `${where}, notes ${[...cell.notes].sort().join(' ')}`;
  }
  return `${where}, empty`;
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Right triangle hugging the top-left corner — a shape/position cue for a
  // mistake that does not depend on color.
  errorFlag: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderRightWidth: 9,
    borderRightColor: 'transparent',
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
