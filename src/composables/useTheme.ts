import { ref, computed } from 'vue'

type Theme = 'light' | 'dark'

const currentTheme = ref<Theme>('light')
const isDark = computed(() => currentTheme.value === 'dark')

export function useTheme() {
  function initTheme() {
    const saved = localStorage.getItem('e_fridge_theme') as Theme | null
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved)
    } else {
      // Default to light for clean default experience
      setTheme('light')
    }
  }

  function setTheme(theme: Theme) {
    currentTheme.value = theme
    localStorage.setItem('e_fridge_theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggleTheme() {
    setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
  }

  return {
    theme: currentTheme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
  }
}
