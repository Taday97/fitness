import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Minus, Plus, X } from 'lucide-react'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'white'; size?: 'md' | 'lg' }

export function Button({ variant = 'primary', size = 'md', className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-bold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
        size === 'lg' ? 'h-14 px-6 text-base' : 'h-11 px-5 text-sm',
        variant === 'primary' && 'bg-grad text-white shadow-glow',
        variant === 'secondary' && 'bg-blush-2 text-primary',
        variant === 'ghost' && 'text-muted hover:bg-blush',
        variant === 'white' && 'bg-white text-primary shadow-card',
        className,
      )}
    />
  )
}

export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cx('rounded-2xl border border-line bg-white p-4 shadow-card', onClick && 'cursor-pointer active:scale-[0.99] transition', className)}>
      {children}
    </div>
  )
}

export function Chip({ active, children, onClick, className }: { active?: boolean; children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition',
        active ? 'bg-grad text-white shadow-glow' : 'border border-line bg-white text-muted',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Label({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{children}</span>
      {right}
    </div>
  )
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 999, unit, big }: {
  value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; unit?: string; big?: boolean
}) {
  const set = (v: number) => onChange(Math.round(Math.min(max, Math.max(min, v)) * 100) / 100)
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => set(value - step)} className="grid size-9 shrink-0 place-items-center rounded-full bg-blush-2 text-primary active:scale-95" aria-label="Menos">
        <Minus size={16} strokeWidth={2.5} />
      </button>
      <div className={cx('min-w-12 text-center font-extrabold tabular', big ? 'text-3xl' : 'text-base')}>
        {value}
        {unit && <span className={cx('ml-0.5 font-bold text-primary', big ? 'text-sm' : 'text-xs')}>{unit}</span>}
      </div>
      <button type="button" onClick={() => set(value + step)} className="grid size-9 shrink-0 place-items-center rounded-full bg-blush-2 text-primary active:scale-95" aria-label="Más">
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export function TopBar({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: boolean | string; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="glass sticky top-0 z-20 flex items-center gap-3 border-b border-line/60 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
      {back && (
        <button onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))} className="-ml-1 grid size-10 place-items-center rounded-full active:bg-blush" aria-label="Volver">
          <ChevronLeft size={24} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
        {subtitle && <p className="truncate text-[11px] font-bold uppercase tracking-wider text-primary">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        className="animate-sheet max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white/95 px-5 pt-4 pb-2 backdrop-blur">
          <div className="text-lg font-bold">{title}</div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-blush" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  )
}

export function Ring({ value, size = 180, stroke = 12, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF4B72" />
            <stop offset="100%" stopColor="#FF7E5F" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FEE8EB" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
          style={{ transition: 'stroke-dashoffset 0.3s linear' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

export function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 py-2 text-left">
      <div className="flex-1">
        <div className="text-sm font-semibold">{label}</div>
        {desc && <div className="text-xs text-muted">{desc}</div>}
      </div>
      <span className={cx('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-grad' : 'bg-line')}>
        <span className={cx('absolute top-1 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-6' : 'left-1')} />
      </span>
    </button>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-xl border border-transparent bg-blush px-4 py-3 text-base outline-none placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/15'

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF4B72" />
          <stop offset="1" stopColor="#FF7E5F" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#lg)" />
      <g stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M10 27h6l3-8 5 15 4-11 2 4h8" />
      </g>
      <circle cx="35" cy="14" r="3" fill="#fff" />
    </svg>
  )
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-blush-2 text-primary">{icon}</div>
      <div className="text-lg font-bold">{title}</div>
      <p className="text-sm text-muted">{text}</p>
      {action}
    </div>
  )
}
