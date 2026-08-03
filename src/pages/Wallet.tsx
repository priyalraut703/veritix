import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import TicketStub from '../components/TicketStub'

type TicketWithEvent = {
  id: string
  ticket_no: number
  used: boolean
  events: { name: string; venue: string | null } | null
}

export default function Wallet() {
  const [email, setEmail] = useState('')
  const [tickets, setTickets] = useState<TicketWithEvent[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  async function findTickets() {
    if (!email) return
    setLoading(true)
    setNotFound(false)
    setTickets(null)

    const { data: wallet } = await supabase
      .from('buyer_wallets')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!wallet) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('tickets')
      .select('id, ticket_no, used, events(name, venue)')
      .eq('buyer_wallet_id', wallet.id)
      .order('created_at', { ascending: false })

    setTickets((data as unknown as TicketWithEvent[]) ?? [])
    setLoading(false)
  }

  return (
    <div className="max-w-[1120px] mx-auto px-8 py-16">
      <h1 className="font-display font-extrabold text-4xl mb-2">My tickets</h1>
      <p className="text-ink-soft mb-10">
        No login needed — just the email you used when you bought.
      </p>

      <div className="flex flex-wrap gap-3 mb-12 max-w-lg">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="[email protected]"
          className="flex-1 border-2 border-ink rounded-pill px-5 py-3"
        />
        <button
          onClick={findTickets}
          disabled={!email || loading}
          className="bg-taupe text-white px-6 py-3 rounded-pill font-semibold border-2 border-ink shadow-hard-sm disabled:opacity-50"
        >
          {loading ? 'Looking…' : 'Find my tickets'}
        </button>
      </div>

      {notFound && (
        <p className="text-ink-soft">
          No wallet found for that email yet — buy a ticket first from the{' '}
          <a href="/events" className="underline">
            Events
          </a>{' '}
          page.
        </p>
      )}

      {tickets && tickets.length === 0 && !notFound && (
        <p className="text-ink-soft">No tickets found for that email.</p>
      )}

      {tickets && tickets.length > 0 && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {tickets.map((t) => (
            <TicketStub
              key={t.id}
              eventName={t.events?.name ?? 'Unknown event'}
              subtitle={t.used ? '✓ used' : t.events?.venue ?? 'VeriTix'}
              ticketNo={String(t.ticket_no).padStart(4, '0')}
              tier="GA"
              accent={t.used ? 'green' : 'blue'}
              verified={t.used}
            />
          ))}
        </div>
      )}
    </div>
  )
}