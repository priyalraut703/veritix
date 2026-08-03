const events = [
  { text: 'verified — gate 2, VX-8821', ok: true },
  { text: 'duplicate scan blocked — VX-4410', ok: false },
  { text: 'resale capped at 20% — VX-1187', ok: true },
  { text: 'bot buy blocked — 40 tix, 1 device', ok: false },
  { text: "minted for Enigma '26 — VX-9902", ok: true },
]

export default function ActivityTicker() {
  const loop = [...events, ...events]
  return (
    <div className="bg-ink text-white py-3.5 overflow-hidden whitespace-nowrap">
      <div className="inline-block font-mono text-[13px] animate-marquee">
        {loop.map((e, i) => (
          <span key={i} className={`mx-6 ${e.ok ? 'text-soft-green' : 'text-white/60'}`}>
            {e.ok ? '✓' : '✕'} {e.text}
          </span>
        ))}
      </div>
    </div>
  )
}