import type { Settings } from '../types'

export type Accent = 'rose' | 'blue' | 'green' | 'purple' | 'orange'
export type ThemeMode = 'light' | 'dark' | 'system'

// Los valores reales de cada color están en index.css (data-accent)
export const ACCENTS: { id: Accent; name: string; from: string; to: string }[] = [
  { id: 'rose', name: 'Rosa', from: '#ff4b72', to: '#ff7e5f' },
  { id: 'blue', name: 'Azul', from: '#3b82f6', to: '#06b6d4' },
  { id: 'green', name: 'Verde', from: '#10b981', to: '#84cc16' },
  { id: 'purple', name: 'Morado', from: '#8b5cf6', to: '#ec4899' },
  { id: 'orange', name: 'Naranja', from: '#f97316', to: '#f59e0b' },
]

const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)')

/** Aplica el color y el modo elegidos en Ajustes al documento. */
export function applyTheme(s: Pick<Settings, 'accent' | 'theme'>) {
  const root = document.documentElement
  const dark = s.theme === 'dark' || (s.theme === 'system' && !!darkQuery()?.matches)
  root.dataset.accent = s.accent
  root.dataset.theme = dark ? 'dark' : 'light'
  // color de la barra de estado del móvil
  const accent = ACCENTS.find((a) => a.id === s.accent) ?? ACCENTS[0]
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111014' : accent.from)
}

/** Mantiene el tema al día: cambios en Ajustes y, en modo automático, cambios del sistema. */
export function watchTheme(get: () => Settings, subscribe: (fn: () => void) => void) {
  applyTheme(get())
  subscribe(() => applyTheme(get()))
  darkQuery()?.addEventListener('change', () => applyTheme(get()))
}
