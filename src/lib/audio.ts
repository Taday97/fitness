// Voz (Web Speech API) y pitidos (Web Audio). Funcionan sin internet en Chrome para Android.

let voice: SpeechSynthesisVoice | null = null

function pickVoice() {
  const vs = window.speechSynthesis?.getVoices() ?? []
  const es = vs.filter((v) => v.lang.toLowerCase().startsWith('es'))
  voice =
    es.find((v) => /es-es/i.test(v.lang) && /female|mujer|helena|elvira|lucia|monica|google/i.test(v.name)) ??
    es.find((v) => /es-(es|mx|us)/i.test(v.lang)) ??
    es[0] ??
    null
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoice()
  window.speechSynthesis.onvoiceschanged = pickVoice
}

export function speak(text: string, opts: { rate?: number; interrupt?: boolean } = {}) {
  if (!('speechSynthesis' in window)) return
  const synth = window.speechSynthesis
  if (opts.interrupt !== false) synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = voice?.lang ?? 'es-ES'
  if (voice) u.voice = voice
  u.rate = opts.rate ?? 1
  synth.speak(u)
}

export const stopSpeaking = () => window.speechSynthesis?.cancel()

let ctx: AudioContext | null = null
export function beep(freq = 880, ms = 140, vol = 0.25) {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = freq
    o.type = 'sine'
    g.gain.setValueAtTime(vol, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + ms / 1000)
  } catch {
    /* sin audio */
  }
}

/** Mantiene la pantalla encendida durante el entrenamiento. */
export async function keepAwake(): Promise<() => void> {
  try {
    const lock = await navigator.wakeLock?.request('screen')
    return () => void lock?.release()
  } catch {
    return () => {}
  }
}

export const vibrate = (p: number | number[]) => navigator.vibrate?.(p)
