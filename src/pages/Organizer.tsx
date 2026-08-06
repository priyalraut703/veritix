import { useEffect, useState } from 'react'
import { supabase, type EventRow } from '../lib/supabaseClient'

type CreateResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; eventName: string; txHash: string }
  | { status: 'error'; message: string }

export default function Organizer() {
  const [name, setName] = useState('')
  const [venue, setVenue] = useState('')
  const [price, setPrice] = useState('100')
  const [result, setResult] = useState<CreateResult>({ status: 'idle' })
  const [events, setEvents] = useState<EventRow[]>([])
  const [stats, setStats] = useState({ minted: 0, verified: 0, blocked: 0, avgRating: null as number | null })

  async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('id', { ascending: false })
    setEvents(data ?? [])
  }

  async function loadStats() {
    const { data: log } = await supabase.from('activity_log').select('kind')
    const minted = log?.filter((l) => l.kind === 'mint').length ?? 0
    const verified = log?.filter((l) => l.kind === 'verify').length ?? 0
    const blocked = log?.filter((l) => l.kind === 'block').length ?? 0

    const { data: feedback } = await supabase.from('feedback').select('rating')
    const avgRating =
      feedback && feedback.length > 0
        ? feedback.reduce((sum, f) => sum + (f.rating ?? 0), 0) / feedback.length
        : null

    setStats({ minted, verified, blocked, avgRating })
  }

  useEffect(() => {
    loadEvents()
    loadStats()
  }, [])

  async function createEvent() {
    if (!name || !price) return
    setResult({ status: 'loading' })

    const { data, error } = await supabase.functions.invoke('create-event', {
      body: { name, venue, face_price_xlm: Number(price), max_resale_bps: 12000 },
    })

    if (error) {
      setResult({ status: 'error', message: error.message })
      return
    }
    if (data?.error) {
      setResult({ status: 'error', message: data.error })
      return
    }

    setResult({ status: 'success', eventName: name, txHash: data.tx_hash })
    setName('')
    setVenue('')
    setPrice('100')
    loadEvents()
    loadStats()
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#C5C6C7 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute -top-20 -left-32 w-[420px] h-[420px] bg-beige/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-[1120px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="inline-flex items-center gap-1.5 font-mono text-[11.5px] px-3 py-1.5 rounded-pill border-2 border-ink bg-beige mb-6">
          For organizers
        </div>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-3 tracking-tight">List your fest</h1>
        <p className="text-ink-soft mb-10 max-w-md">
          Every event you create here is minted as a real on-chain event — tickets sold against
          it are automatically fraud-proof and resale-capped at 20%.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-14">
          <div className="border-2 border-ink rounded-card bg-white p-4 text-center">
            <div className="font-display font-extrabold text-3xl">{stats.minted}</div>
            <div className="font-mono text-[10px] text-ink-soft uppercase">tickets minted</div>
          </div>
          <div className="border-2 border-ink rounded-card bg-soft-green p-4 text-center">
            <div className="font-display font-extrabold text-3xl">{stats.verified}</div>
            <div className="font-mono text-[10px] uppercase">gate verifications</div>
          </div>
          <div className="border-2 border-ink rounded-card bg-beige p-4 text-center">
            <div className="font-display font-extrabold text-3xl">{stats.blocked}</div>
            <div className="font-mono text-[10px] uppercase">fraud attempts blocked</div>
          </div>
          <div className="border-2 border-ink rounded-card bg-pale-blue p-4 text-center">
            <div className="font-display font-extrabold text-3xl">
              {stats.avgRating ? stats.avgRating.toFixed(1) : '—'}
            </div>
            <div className="font-mono text-[10px] uppercase">avg tester rating</div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_1.2fr] gap-12">
          <div className="border-2 border-ink rounded-card bg-white p-8 shadow-hard h-fit">
            <h3 className="font-display font-bold text-xl mb-6">New event</h3>

            <label className="block text-xs font-mono text-ink-soft mb-1">Event name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enigma '26"
              className="w-full border-2 border-ink rounded-lg px-3 py-2.5 mb-4"
            />

            <label className="block text-xs font-mono text-ink-soft mb-1">Venue (optional)</label>
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="IIT Bombay"
              className="w-full border-2 border-ink rounded-lg px-3 py-2.5 mb-4"
            />

            <label className="block text-xs font-mono text-ink-soft mb-1">Face price (XLM)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border-2 border-ink rounded-lg px-3 py-2.5 mb-2"
            />
            <p className="text-xs text-ink-soft mb-6">
              Resale is automatically capped at 20% above this price — enforced by the contract.
            </p>

            {result.status === 'success' ? (
              <div className="border-2 border-ink rounded-card bg-soft-green p-4 text-center mb-3">
                <p className="font-semibold">🎉 {result.eventName} is live</p>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${result.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline break-all"
                >
                  View transaction
                </a>
              </div>
            ) : null}
            {result.status === 'error' && (
              <p className="text-xs text-taupe mb-3">{result.message}</p>
            )}

            <button
              onClick={createEvent}
              disabled={!name || !price || result.status === 'loading'}
              className="w-full bg-taupe text-white px-6 py-3.5 rounded-pill font-semibold border-2 border-ink shadow-hard-sm disabled:opacity-50"
            >
              {result.status === 'loading' ? 'Minting event on-chain…' : 'Create event'}
            </button>
          </div>

          <div>
            <h3 className="font-display font-bold text-xl mb-6">Your events</h3>
            {events.length === 0 && (
              <p className="text-ink-soft text-sm">No events yet — create your first one.</p>
            )}
            <div className="flex flex-col gap-3">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="border-2 border-ink rounded-card bg-white p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-display font-bold">{e.name}</p>
                    <p className="text-xs text-ink-soft font-mono">
                      event #{e.id} · {(e.face_price_stroops / 10_000_000).toFixed(0)} XLM
                    </p>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-pill border-2 border-ink bg-pale-blue">
                    live
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
