import { useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Download, ExternalLink, KeyRound, Trash2, Upload, UserRound, Volume2 } from 'lucide-react'
import { useStore } from '../store'
import { DEFAULT_MODEL, GeminiError, listModels } from '../lib/gemini'
import { beep, speak } from '../lib/audio'
import { downloadJSON } from '../lib/utils'
import { Button, Card, Field, Label, Stepper, Toggle, TopBar, inputCls } from '../components/ui'

export default function SettingsScreen() {
  const nav = useNavigate()
  const store = useStore()
  const { settings, setSettings } = store
  const [key, setKey] = useState(settings.apiKey)
  const [models, setModels] = useState<string[]>([])
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function testKey() {
    setBusy(true)
    setStatus(null)
    try {
      const list = await listModels(key)
      setSettings({ apiKey: key.trim() })
      setModels(list)
      setStatus({ ok: true, text: `Clave correcta. ${list.length} modelos disponibles.` })
    } catch (e) {
      setStatus({ ok: false, text: e instanceof GeminiError ? e.message : 'No se pudo comprobar la clave.' })
    } finally {
      setBusy(false)
    }
  }

  function exportData() {
    const { profile, plan, customRoutines, sessions, checkIns, settings } = useStore.getState()
    // La clave no se exporta: el archivo puede acabar en cualquier sitio
    downloadJSON(`forma-ai-${new Date().toISOString().slice(0, 10)}.json`, {
      app: 'forma-ai',
      version: 1,
      profile, plan, customRoutines, sessions, checkIns,
      settings: { ...settings, apiKey: '' },
    })
  }

  async function importData(file: File) {
    try {
      const d = JSON.parse(await file.text())
      if (d?.app !== 'forma-ai' || !d.profile) throw new Error()
      if (!confirm('Esto reemplazará todos tus datos actuales por los de la copia. ¿Continuar?')) return
      store.importData({ ...d, settings: { ...d.settings, apiKey: settings.apiKey } })
      nav('/')
    } catch {
      alert('Ese archivo no es una copia de seguridad válida de Forma AI.')
    }
  }

  function resetAll() {
    if (!confirm('Se borrarán tu perfil, plan, rutinas, entrenamientos y progreso. ¿Seguro?')) return
    if (!confirm('No se puede deshacer. Si quieres conservar algo, exporta antes una copia. ¿Borrar todo?')) return
    store.reset()
    nav('/onboarding')
  }

  const modelOptions = Array.from(new Set([settings.model || DEFAULT_MODEL, ...models]))

  return (
    <div className="pb-10">
      <TopBar title="Ajustes" back="/" />
      <div className="space-y-5 px-4 pt-4">
        <Card>
          <button onClick={() => nav('/onboarding?edit=1')} className="flex w-full items-center gap-3 text-left">
            <span className="grid size-10 place-items-center rounded-full bg-blush-2 text-primary"><UserRound size={20} /></span>
            <span className="flex-1">
              <span className="block text-sm font-bold">Mi perfil</span>
              <span className="block text-xs text-muted">Medidas, objetivo, días y material</span>
            </span>
          </button>
        </Card>

        <section>
          <Label>Inteligencia artificial (Gemini)</Label>
          <Card className="space-y-3">
            <Field label="Clave de API" hint="Se guarda solo en este teléfono.">
              <input
                type="password"
                autoComplete="off"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIza…"
                className={inputCls}
              />
            </Field>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              Conseguir clave gratis en Google AI Studio <ExternalLink size={14} />
            </a>
            <div className="flex gap-2">
              <Button onClick={testKey} disabled={!key.trim() || busy} className="flex-1">
                <KeyRound size={16} /> {busy ? 'Comprobando…' : 'Guardar y comprobar'}
              </Button>
              {settings.apiKey && (
                <Button variant="secondary" onClick={() => { setKey(''); setSettings({ apiKey: '' }); setStatus(null) }}>
                  Quitar
                </Button>
              )}
            </div>
            {status && <p className={status.ok ? 'text-sm font-semibold text-emerald-600' : 'text-sm font-semibold text-primary-dark'}>{status.text}</p>}
            <Field label="Modelo" hint="Los modelos «flash» son rápidos y entran en la capa gratuita.">
              <select value={settings.model} onChange={(e) => setSettings({ model: e.target.value })} className={inputCls}>
                {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </Card>
        </section>

        <section>
          <Label>Descansos por defecto</Label>
          <Card className="space-y-4">
            <Row label="Entre series"><Stepper value={settings.restBetweenSets} onChange={(v) => setSettings({ restBetweenSets: v })} step={5} min={0} max={300} unit="s" /></Row>
            <Row label="Entre ejercicios"><Stepper value={settings.restBetweenExercises} onChange={(v) => setSettings({ restBetweenExercises: v })} step={5} min={0} max={300} unit="s" /></Row>
            <Row label="Preparación antes de empezar"><Stepper value={settings.prepSec} onChange={(v) => setSettings({ prepSec: v })} step={5} min={0} max={60} unit="s" /></Row>
            <p className="text-xs text-muted">Si en una rutina pones un descanso concreto a un ejercicio, se usa ese.</p>
          </Card>
        </section>

        <section>
          <Label>Voz y sonido</Label>
          <Card>
            <Toggle checked={settings.voice} onChange={(v) => setSettings({ voice: v })} label="Guía por voz" desc="Te dice el ejercicio, las repeticiones y cuándo descansar" />
            <Toggle checked={settings.countReps} onChange={(v) => setSettings({ countReps: v })} label="Contar repeticiones en voz alta" desc="Sigue el ritmo del muñeco" />
            <Toggle checked={settings.beeps} onChange={(v) => setSettings({ beeps: v })} label="Pitidos" desc="Cuenta atrás 3, 2, 1" />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">Velocidad de la voz</span>
              <Stepper value={settings.voiceRate} onChange={(v) => setSettings({ voiceRate: v })} step={0.05} min={0.7} max={1.5} />
            </div>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => { beep(); speak('¡Vamos! Diez sentadillas. Tú puedes.', { rate: settings.voiceRate }) }}>
              <Volume2 size={16} /> Probar voz
            </Button>
          </Card>
        </section>

        <section>
          <Label>Tus datos</Label>
          <Card className="space-y-2">
            <p className="text-xs text-muted">Todo se guarda en este teléfono. Exporta una copia de vez en cuando por si cambias de móvil o borras el navegador.</p>
            <Button variant="secondary" className="w-full" onClick={exportData}><Download size={16} /> Exportar copia de seguridad</Button>
            <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()}><Upload size={16} /> Importar copia</Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void importData(f); e.target.value = '' }}
            />
            <Button variant="ghost" className="w-full text-primary-dark" onClick={resetAll}><Trash2 size={16} /> Borrar todos los datos</Button>
          </Card>
        </section>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-faint">
          <Check size={12} /> Los cambios se guardan solos
        </p>
        <p className="px-4 text-center text-xs text-faint">
          Las calorías, proteínas y plazos son estimaciones orientativas, no consejo médico.
        </p>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </div>
  )
}
