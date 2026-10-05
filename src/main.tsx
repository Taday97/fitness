import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Figure from './figure/Figure'
import { ANIMS } from './figure/animations'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, background: '#fff' }}>
      {Object.keys(ANIMS).slice(Number(new URLSearchParams(location.search).get("a") ?? 0), Number(new URLSearchParams(location.search).get("b") ?? 99)).flatMap((k) => [
        <div key={k} style={{ gridColumn: '1 / -1', font: '12px sans-serif' }}>{k}</div>,
        ...[0, 0.25, 0.5, 0.75, 0.9].map((s) => (
          <Figure key={k + s} anim={k} playing={false} still={s} className="h-28 w-full border" />
        )),
      ])}
    </div>
  </StrictMode>,
)
