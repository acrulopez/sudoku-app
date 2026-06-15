import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DIFFICULTIES } from '../../domain/types';
import type { Difficulty } from '../../domain/types';
import { useGameStore } from '../../state/gameStore';
import { useTheme } from '../theme/ThemeProvider';
import { ThemePicker } from '../components/ThemePicker/ThemePicker';
import { GameSettings } from '../components/Settings/GameSettings';

const LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  extreme: 'Extreme',
};

export function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const c = theme.colors;
  const newGame = useGameStore((s) => s.newGame);
  const resumeSavedGame = useGameStore((s) => s.resumeSavedGame);
  const hasSavedGame = useGameStore((s) => s.hasSavedGame);
  const insets = useSafeAreaInsets();

  const start = (d: Difficulty) => {
    newGame(d);
    router.push('/game');
  };

  const resume = () => {
    if (resumeSavedGame()) router.push('/game');
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={[styles.title, { color: c.text }]}>Sudoku</Text>

      {hasSavedGame() && (
        <Pressable
          onPress={resume}
          style={[styles.resume, { backgroundColor: c.primary }]}
        >
          <Text style={styles.resumeText}>Continue game</Text>
        </Pressable>
      )}

      <Text style={[styles.section, { color: c.textMuted }]}>New game</Text>
      <View style={styles.list}>
        {DIFFICULTIES.map((d) => (
          <Pressable
            key={d}
            onPress={() => start(d)}
            style={[styles.diffButton, { backgroundColor: c.surface, borderColor: c.gridLine }]}
          >
            <Text style={[styles.diffText, { color: c.text }]}>{LABELS[d]}</Text>
            <Text style={[styles.chevron, { color: c.textMuted }]}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.themeWrap}>
        <GameSettings />
      </View>

      <View style={styles.themeWrap}>
        <ThemePicker />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 40, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  resume: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  resumeText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  section: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginTop: 8 },
  list: { gap: 10 },
  diffButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  diffText: { fontSize: 18, fontWeight: '600' },
  chevron: { fontSize: 22 },
  themeWrap: { marginTop: 16 },
});
