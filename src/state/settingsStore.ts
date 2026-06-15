/**
 * Persisted user settings: selected theme, default fast mode, note validation.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStateStorage } from './persist';
import { DEFAULT_THEME_KEY } from '../ui/theme/themes';

interface SettingsState {
  themeKey: string;
  /** Whether Fast Mode (number-first) starts enabled. */
  fastModeDefault: boolean;
  /** Block illegal pencil notes. */
  validateNotes: boolean;
  /** Cap on mistakes before the game is lost (0 = unlimited). */
  maxMistakes: number;

  setThemeKey: (key: string) => void;
  setFastModeDefault: (v: boolean) => void;
  setValidateNotes: (v: boolean) => void;
  setMaxMistakes: (v: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeKey: DEFAULT_THEME_KEY,
      fastModeDefault: false,
      validateNotes: true,
      maxMistakes: 3,

      setThemeKey: (themeKey) => set({ themeKey }),
      setFastModeDefault: (fastModeDefault) => set({ fastModeDefault }),
      setValidateNotes: (validateNotes) => set({ validateNotes }),
      setMaxMistakes: (maxMistakes) => set({ maxMistakes }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => mmkvStateStorage),
    },
  ),
);
