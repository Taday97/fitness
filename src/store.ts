import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CheckIn, Plan, Profile, Routine, Session, Settings } from './types'
import { DEFAULT_MODEL, setModelListener } from './lib/gemini'
import { weekday } from './lib/utils'

export const DEFAULT_SETTINGS: Settings = {
  accent: 'rose',
  theme: 'light',
  apiKey: '',
  model: DEFAULT_MODEL,
  voice: true,
  countReps: false,
  beeps: true,
  restBetweenSets: 30,
  restBetweenExercises: 45,
  prepSec: 10,
  voiceRate: 1.05,
}

interface State {
  profile?: Profile
  plan?: Plan
  customRoutines: Routine[]
  sessions: Session[]
  checkIns: CheckIn[]
  settings: Settings
  setProfile: (p: Profile) => void
  setPlan: (p: Plan) => void
  saveRoutine: (r: Routine) => void
  deleteRoutine: (id: string) => void
  addSession: (s: Session) => void
  addCheckIn: (c: CheckIn) => void
  setSettings: (s: Partial<Settings>) => void
  importData: (d: Partial<State>) => void
  reset: () => void
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      customRoutines: [],
      sessions: [],
      checkIns: [],
      settings: DEFAULT_SETTINGS,
      setProfile: (profile) => set({ profile }),
      setPlan: (plan) => set({ plan }),
      saveRoutine: (r) =>
        set((st) => {
          if (r.source === 'custom') {
            const exists = st.customRoutines.some((x) => x.id === r.id)
            return { customRoutines: exists ? st.customRoutines.map((x) => (x.id === r.id ? r : x)) : [...st.customRoutines, r] }
          }
          if (!st.plan) return {}
          return { plan: { ...st.plan, routines: st.plan.routines.map((x) => (x.id === r.id ? r : x)) } }
        }),
      deleteRoutine: (id) =>
        set((st) => ({
          customRoutines: st.customRoutines.filter((x) => x.id !== id),
          plan: st.plan && { ...st.plan, routines: st.plan.routines.filter((x) => x.id !== id) },
        })),
      addSession: (s) => set((st) => ({ sessions: [...st.sessions, s] })),
      addCheckIn: (c) =>
        set((st) => ({
          checkIns: [...st.checkIns, c],
          profile: st.profile && {
            ...st.profile,
            weightKg: c.weightKg,
            waistCm: c.waistCm ?? st.profile.waistCm,
            hipCm: c.hipCm ?? st.profile.hipCm,
          },
        })),
      setSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
      importData: (d) =>
        set({
          profile: d.profile,
          plan: d.plan,
          customRoutines: d.customRoutines ?? [],
          sessions: d.sessions ?? [],
          checkIns: d.checkIns ?? [],
          settings: { ...DEFAULT_SETTINGS, ...d.settings },
        }),
      reset: () =>
        set({ profile: undefined, plan: undefined, customRoutines: [], sessions: [], checkIns: [], settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'forma-ai',
      version: 1,
      merge: (persisted, current) => {
        const p = persisted as Partial<State>
        const settings = { ...DEFAULT_SETTINGS, ...p?.settings }
        // gemini-2.5-flash ya no está disponible para claves nuevas
        if (settings.model === 'gemini-2.5-flash') settings.model = DEFAULT_MODEL
        return { ...current, ...p, settings }
      },
    },
  ),
)

setModelListener((model) => useStore.getState().setSettings({ model }))

/** Todas las rutinas: las propias primero (sus días tienen prioridad). */
export const useRoutines = () => {
  const plan = useStore((s) => s.plan)
  const custom = useStore((s) => s.customRoutines)
  return [...custom, ...(plan?.routines ?? [])]
}

export const findRoutine = (routines: Routine[], id: string) => routines.find((r) => r.id === id)

export const todayRoutine = (routines: Routine[], d = new Date()) => routines.find((r) => r.days.includes(weekday(d)))
