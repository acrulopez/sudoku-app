import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { canUndo as historyCanUndo } from '../../domain/history';
import { useGameStore } from '../../state/gameStore';
import { useSettingsStore } from '../../state/settingsStore';
import { computeMistakes, remainingCounts } from '../../state/selectors';
import { useGameTimer } from '../hooks/useGameTimer';
import { useTheme } from '../theme/ThemeProvider';
import { FAST_MODE_ACCENT } from '../theme/themes';
import { Board } from '../components/Board/Board';
import { Controls } from '../components/Controls/Controls';
import { GameHeader } from '../components/Header/GameHeader';
import { NumberPad } from '../components/NumberPad/NumberPad';

export function GameScreen() {
  const router = useRouter();
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  useGameTimer();

  const s = useGameStore();
  const maxMistakes = useSettingsStore((st) => st.maxMistakes);

  const mistakes = useMemo(
    () => computeMistakes(s.board, s.puzzle?.solution ?? ''),
    [s.board, s.puzzle],
  );

  // Vibrate when the mistake count climbs (a wrong value was just placed).
  const prevMistakes = useRef(s.mistakes);
  useEffect(() => {
    if (s.mistakes > prevMistakes.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    prevMistakes.current = s.mistakes;
  }, [s.mistakes]);

  if (!s.puzzle) {
    // No active game (e.g. deep link) — bounce home.
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: c.background }]}>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={{ color: c.primary, fontSize: 16 }}>Back to menu</Text>
        </Pressable>
      </View>
    );
  }

  const paused = s.status === 'paused';
  const remaining = remainingCounts(s.board);
  const activeValue =
    s.selectedDigit ?? (s.selectedIndex !== null ? s.board[s.selectedIndex].value : null);

  const overlayText = s.status === 'won' ? 'Solved! 🎉' : s.status === 'lost' ? 'Out of mistakes' : null;

  return (
    <View
      style={[
        styles.flex,
        { backgroundColor: c.background, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <GameHeader
        difficulty={s.difficulty}
        mistakes={s.mistakes}
        maxMistakes={maxMistakes}
        elapsed={s.elapsed}
        paused={paused}
        onBack={() => router.replace('/')}
        onTogglePause={() => s.setPaused(!paused)}
      />

      <View style={styles.boardWrap}>
        {paused ? (
          <Pressable
            onPress={() => s.setPaused(false)}
            style={[styles.pausedBox, { backgroundColor: c.surface, borderColor: c.gridLine }]}
          >
            <Text style={{ color: c.textMuted, fontSize: 18 }}>Paused — tap to resume</Text>
          </Pressable>
        ) : (
          <Board
            board={s.board}
            selectedIndex={s.selectedIndex}
            activeValue={activeValue}
            mistakes={mistakes}
            fastMode={s.fastMode}
            flashCells={s.flashCells}
            onCellPress={s.selectCell}
          />
        )}

        {overlayText && (
          <View style={[styles.overlay, { backgroundColor: c.surface, borderColor: c.gridLine }]}>
            <Text style={[styles.overlayText, { color: c.text }]}>{overlayText}</Text>
            <Pressable
              onPress={() => router.replace('/')}
              style={[styles.overlayBtn, { backgroundColor: c.primary }]}
            >
              <Text style={styles.overlayBtnText}>New game</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.fastModeRow}>
        <Text style={[styles.fastIcon, { color: s.fastMode ? FAST_MODE_ACCENT : c.textMuted }]}>
          ⚡
        </Text>
        <View style={styles.switchScale}>
          <Switch
            value={s.fastMode}
            onValueChange={s.toggleFastMode}
            trackColor={{ true: FAST_MODE_ACCENT, false: c.gridLine }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={c.gridLine}
          />
        </View>
      </View>

      <View style={styles.bottom}>
        <Controls
          pencilMode={s.pencilMode}
          canUndo={historyCanUndo(s.history)}
          onUndo={s.undo}
          onErase={s.erase}
          onFastPencil={s.fastPencil}
          onTogglePencil={s.togglePencil}
        />
        <NumberPad
          remaining={remaining}
          activeDigit={s.selectedDigit}
          invalidFlash={s.invalidFlash}
          onPress={s.pressDigit}
        />
      </View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  boardWrap: { paddingHorizontal: 8, marginTop: 12 },
  pausedBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  overlayText: { fontSize: 28, fontWeight: '800' },
  overlayBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  overlayBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  fastModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  fastIcon: { fontSize: 15, fontWeight: '700' },
  switchScale: { transform: [{ scale: 0.75 }] },
  bottom: { paddingHorizontal: 8, paddingBottom: 8 },
  spacer: { flex: 1 },
});
