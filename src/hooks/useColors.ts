import { useThemeStore } from '../store/themeStore';
import { lightColors, darkColors, getShadow, Colors } from '../../constants/theme';

export function useColors(): Colors & { shadow: ReturnType<typeof getShadow> } {
  const { isDark } = useThemeStore();
  const c = isDark ? darkColors : lightColors;
  return { ...c, shadow: getShadow(isDark) };
}
