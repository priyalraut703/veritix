import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type ScanResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'valid'; txHash: string }
  | { status: 'invalid'; reason: string }

export default function Verify() {
  const [eventId, setEventId] = useState('1')
  const [ticketNo, setTicketNo] = useState('')
  const [result, setResult] = useState<ScanResult>({ status: 'idle' })

  async function scan() {
    if (!ticketNo) return
    setResult({ status: 'loading' })

    const { data, error } = await supabase.functions.invoke('verify-ticket', {
      body: { event_id: Number(eventId), ticket_no: Number(ticketNo) },
    })

    if (error) {
      setResult({ status: 'invalid', reason: error.message })
      return
    }
    if (data?.valid) {
      setResult({ status: 'valid', txHash: data.tx_hash })
    } else {
      setResult({ status: 'invalid', reason: data?.reason ?? 'Unknown ticket' })
    }
  }

  function reset() {
    setTicketNo('')
    setResult({ status: 'idle' })
  }

  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#C5C6C7 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative max-w-[560px] mx-auto px-8 py-16 text-center">
        <div className="inline-flex items-center gap-1.5 font-mono text-[11.5px] px-3 py-1.5 rounded-pill border-2 border-ink bg-pale-blue mb-6">
          Gate scanner
        </div>
        <h1 className="font-display font-extrabold text-4xl mb-3">Verify a ticket</h1>
        <p className="text-ink-soft mb-10">
          Enter the event and ticket number from a QR code to confirm it's valid — this checks
          and marks it used on-chain in one call, so it can't be scanned twice.
        </p>

        <div className="border-2 border-ink rounded-card bg-white p-8 shadow-hard text-left">
          <label className="block text-xs font-mono text-ink-soft mb-1">Event ID</label>
          <input
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full border-2 border-ink rounded-lg px-3 py-2 mb-4 font-mono"
          />
          <label className="block text-xs font-mono text-ink-soft mb-1">Ticket number</label>
          <input
            value={ticketNo}
            onChange={(e) => setTicketNo(e.target.value)}
            placeholder="e.g. 5"
            className="w-full border-2 border-ink rounded-lg px-3 py-2 mb-6 font-mono"
          />

          {result.status === 'idle' || result.status === 'loading' ? (
            <button
              onClick={scan}
              disabled={!ticketNo || result.status === 'loading'}
              className="w-full bg-taupe text-white px-6 py-4 rounded-pill font-semibold border-2 border-ink shadow-hard disabled:opacity-50"
            >
              {result.status === 'loading' ? 'Checking on-chain…' : 'Scan ticket'}
            </button>
          ) : (
            <div className="text-center">
              {result.status === 'valid' ? (
                <div className="border-2 border-ink rounded-card bg-soft-green p-6 mb-4">
                  <div className="text-3xl mb-2">✓</div>
                  <p className="font-display font-bold text-xl">Verified — let them in</p>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${result.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline text-ink/70 break-all"
                  >
                    View transaction
                  </a>
                </div>
              ) : (
                <div className="border-2 border-ink rounded-card bg-beige p-6 mb-4">
                  <div className="text-3xl mb-2">✕</div>
                  <p className="font-display font-bold text-xl">Not valid</p>
                  <p className="text-sm text-ink/70 mt-1">{result.reason}</p>
                </div>
              )}
              <button
                onClick={reset}
                className="w-full bg-white px-6 py-3 rounded-pill font-semibold border-2 border-ink"
              >
                Scan next ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}