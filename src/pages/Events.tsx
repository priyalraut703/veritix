import { useEffect, useState } from 'react'
import { supabase, type EventRow } from '../lib/supabaseClient'
import TicketStub from '../components/TicketStub'

type PurchaseResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; ticketNo: number; txHash: string }
  | { status: 'error'; message: string }

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
      if (error) {
        setLoadError(error.message)
      } else {
        setEvents(data ?? [])
      }
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

    // Find the next free ticket number for this event.
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('ticket_no')
      .eq('event_id', event.id)
      .order('ticket_no', { ascending: false })
      .limit(1)

    const nextTicketNo = existingTickets && existingTickets.length > 0
      ? existingTickets[0].ticket_no + 1
      : 1

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
    <div className="max-w-[1120px] mx-auto px-8 py-16">
      <h1 className="font-display font-extrabold text-4xl mb-2">Browse events</h1>
      <p className="text-ink-soft mb-12">Every ticket below is minted on-chain the moment you buy it.</p>

      {loading && <p className="text-ink-soft">Loading events…</p>}
      {loadError && (
        <p className="text-taupe">
          Couldn't load events: {loadError}. Check your VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
          in .env.local.
        </p>
      )}
      {!loading && !loadError && events.length === 0 && (
        <p className="text-ink-soft">
          No events yet — add one to the <code>events</code> table in Supabase to see it here.
        </p>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {events.map((event) => (
          <div key={event.id} className="flex flex-col items-center gap-4">
            <TicketStub
              eventName={event.name}
              subtitle={event.venue ?? 'VeriTix'}
              ticketNo={String(event.id).padStart(4, '0')}
              tier="GA"
              accent="blue"
            />
            <div className="text-sm font-mono text-ink-soft">
              {(event.face_price_stroops / 10_000_000).toFixed(0)} XLM
            </div>

            {openEventId !== event.id ? (
              <button
                onClick={() => openBuyForm(event.id)}
                className="whitespace-nowrap inline-flex items-center gap-2 bg-taupe text-white px-6 py-3 rounded-pill font-semibold text-sm border-2 border-ink shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Buy ticket
              </button>
            ) : (
              <div className="w-full max-w-[270px] border-2 border-ink rounded-card p-4 bg-white">
                {result.status === 'success' ? (
                  <div className="text-center">
                    <p className="font-semibold mb-1">🎟 Ticket #{result.ticketNo} minted!</p>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${result.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline text-ink-soft break-all"
                    >
                      View transaction
                    </a>
                  </div>
                ) : (
                  <>
                    <label className="block text-xs font-mono text-ink-soft mb-1">
                      Your email (creates your ticket wallet)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="[email protected]"
                      className="w-full border-2 border-ink rounded-lg px-3 py-2 text-sm mb-3"
                    />
                    {result.status === 'error' && (
                      <p className="text-xs text-taupe mb-2">{result.message}</p>
                    )}
                    <button
                      onClick={() => buyTicket(event)}
                      disabled={!email || result.status === 'loading'}
                      className="w-full bg-soft-green text-ink px-4 py-2 rounded-pill font-semibold text-sm border-2 border-ink disabled:opacity-50"
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
  )
}