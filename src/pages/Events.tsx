import { useEffect, useState } from 'react'
import { supabase, type EventRow } from '../lib/supabaseClient'
import TicketStub from '../components/TicketStub'

type PurchaseResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; ticketNo: number; txHash: string }
  | { status: 'error'; message: string }

const accents: Array<'blue' | 'beige' | 'green'> = ['blue', 'beige', 'green']

export default function Events() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [openEventId, setOpenEventId] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<PurchaseResult>({ status: 'idle' })

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase.from('events').select('*').order('id')
      if (error) setLoadError(error.message)
      else setEvents(data ?? [])
      setLoading(false)
    }
    loadEvents()
  }, [])

  function openBuyForm(eventId: number) {
    setOpenEventId(eventId)
    setEmail('')
    setResult({ status: 'idle' })
  }

  async function buyTicket(event: EventRow) {
    if (!email) return
    setResult({ status: 'loading' })

    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('ticket_no')
      .eq('event_id', event.id)
      .order('ticket_no', { ascending: false })
      .limit(1)

    const nextTicketNo =
      existingTickets && existingTickets.length > 0 ? existingTickets[0].ticket_no + 1 : 1

    const { data, error } = await supabase.functions.invoke('buy-ticket', {
      body: {
        email,
        event_id: event.id,
        ticket_no: nextTicketNo,
        purchase_price_stroops: event.face_price_stroops,
      },
    })

    if (error) {
      setResult({ status: 'error', message: error.message })
      return
    }
    if (data?.error) {
      setResult({ status: 'error', message: data.error })
      return
    }
    setResult({ status: 'success', ticketNo: nextTicketNo, txHash: data.tx_hash })
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
      <div className="absolute -top-20 -right-32 w-[420px] h-[420px] bg-pale-blue/50 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-[1120px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="inline-flex items-center gap-1.5 font-mono text-[11.5px] px-3 py-1.5 rounded-pill border-2 border-ink bg-soft-green mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-ink animate-pulse" /> minted live, on testnet
        </div>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-3 tracking-tight">Browse events</h1>
        <p className="text-ink-soft mb-14 max-w-md">
          Every ticket below is minted on-chain the moment you buy it — no wallet setup required.
        </p>

        {loading && <p className="text-ink-soft font-mono text-sm">Loading events…</p>}
        {loadError && (
          <div className="border-2 border-ink rounded-card bg-beige p-6 max-w-lg">
            <p className="font-semibold mb-1">Couldn't load events</p>
            <p className="text-sm">{loadError}</p>
          </div>
        )}
        {!loading && !loadError && events.length === 0 && (
          <div className="border-2 border-dashed border-line rounded-card p-10 max-w-lg text-center">
            <p className="text-ink-soft">
              No events yet — add one to the <code className="font-mono">events</code> table in
              Supabase to see it here.
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10">
          {events.map((event, i) => (
            <div
              key={event.id}
              className="flex flex-col items-center gap-5 border-2 border-transparent hover:border-ink/10 rounded-card p-4 transition-colors"
            >
              <TicketStub
                eventName={event.name}
                subtitle={event.venue ?? 'VeriTix'}
                ticketNo={String(event.id).padStart(4, '0')}
                tier="GA"
                accent={accents[i % accents.length]}
                rotateClass={i % 2 === 0 ? '-rotate-1' : 'rotate-1'}
              />
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-lg">
                  {(event.face_price_stroops / 10_000_000).toFixed(0)} XLM
                </span>
                <span className="font-mono text-xs text-ink-soft">face price</span>
              </div>

              {openEventId !== event.id ? (
                <button
                  onClick={() => openBuyForm(event.id)}
                  className="w-full whitespace-nowrap inline-flex items-center justify-center gap-2 bg-taupe text-white px-6 py-3.5 rounded-pill font-semibold text-sm border-2 border-ink shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  Buy ticket <span aria-hidden>→</span>
                </button>
              ) : (
                <div className="w-full max-w-[280px] border-2 border-ink rounded-card p-5 bg-white shadow-hard-sm">
                  {result.status === 'success' ? (
                    <div className="text-center">
                      <div className="text-2xl mb-1">🎟️</div>
                      <p className="font-display font-bold mb-1">
                        Ticket #{result.ticketNo} minted!
                      </p>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${result.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline text-ink-soft break-all"
                      >
                        View transaction
                      </a>
                      <a
                        href="/feedback"
                        className="block mt-3 text-xs font-semibold bg-soft-green rounded-pill px-3 py-2 border-2 border-ink"
                      >
                        Got 30 sec? Tell us how it went →
                      </a>
                    </div>
                  ) : (
                    <>
                      <label className="block text-xs font-mono text-ink-soft mb-1.5">
                        Your email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="[email protected]"
                        className="w-full border-2 border-ink rounded-lg px-3 py-2.5 text-sm mb-3"
                      />
                      {result.status === 'error' && (
                        <p className="text-xs text-taupe mb-2">{result.message}</p>
                      )}
                      <button
                        onClick={() => buyTicket(event)}
                        disabled={!email || result.status === 'loading'}
                        className="w-full bg-soft-green text-ink px-4 py-2.5 rounded-pill font-semibold text-sm border-2 border-ink disabled:opacity-50"
                      >
                        {result.status === 'loading' ? 'Minting…' : 'Confirm purchase'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
