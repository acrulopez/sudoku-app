import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Difficulty } from '../../../domain/types';
import { useTheme } from '../../theme/ThemeProvider';

interface Props {
  difficulty: Difficulty;
  mistakes: number;
  maxMistakes: number;
  elapsed: number;
  paused: boolean;
  onBack: () => void;
  onTogglePause: () => void;
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  extreme: 'Extreme',
};

export function GameHeader({
  difficulty,
  mistakes,
  maxMistakes,
  elapsed,
  paused,
  onBack,
  onTogglePause,
}: Props) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onBack}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Back to menu"
        >
          <Text style={[styles.back, { color: c.text }]}>←</Text>
        </Pressable>
      </View>
      <View style={styles.statsRow}>
        <Text
          style={[styles.stat, { color: c.textMuted }]}
          accessibilityLabel={`Mistakes ${mistakes}${maxMistakes > 0 ? ` of ${maxMistakes}` : ''}`}
        >
          Mistakes: {mistakes}
          {maxMistakes > 0 ? `/${maxMistakes}` : ''}
        </Text>
        <Text style={[styles.stat, { color: c.textMuted }]}>{LABELS[difficulty]}</Text>
        <Pressable
          onPress={onTogglePause}
          style={styles.timer}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Time ${formatTime(elapsed)}. ${paused ? 'Paused, tap to resume' : 'Tap to pause'}`}
        >
          <Text style={[styles.stat, { color: c.textMuted }]} accessibilityElementsHidden importantForAccessibility="no">
            {formatTime(elapsed)} {paused ? '▶' : '❚❚'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { fontSize: 26 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stat: { fontSize: 15 },
  timer: { flexDirection: 'row', alignItems: 'center' },
});
