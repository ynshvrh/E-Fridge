import { ref, computed } from 'vue'

export type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem('e_fridge_theme') as Theme | null
    if (saved === 'dark' || saved === 'light') {
      return saved
    }
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const currentTheme = ref<Theme>(getInitialTheme())
const isDark = computed(() => currentTheme.value === 'dark')

function applyThemeToDom(theme: Theme) {
  if (typeof document === 'undefined') return
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  try {
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }))
  } catch {}
}

// Immediately apply theme upon module load
applyThemeToDom(currentTheme.value)

export function useTheme() {
  function setTheme(theme: Theme) {
    currentTheme.value = theme
    try {
      localStorage.setItem('e_fridge_theme', theme)
    } catch {}
    applyThemeToDom(theme)
  }

  function toggleTheme() {
    const isCurrentlyDark = typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : currentTheme.value === 'dark'
    setTheme(isCurrentlyDark ? 'light' : 'dark')
  }

  function initTheme() {
    const theme = getInitialTheme()
    setTheme(theme)
  }

  return {
    theme: currentTheme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
  }
}

