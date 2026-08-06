import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Feedback() {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit() {
    if (!rating) return
    setStatus('sending')

    const { data: wallet } = email
      ? await supabase.from('buyer_wallets').select('id').eq('email', email).maybeSingle()
      : { data: null }

    const { error } = await supabase.from('feedback').insert({
      buyer_wallet_id: wallet?.id ?? null,
      rating,
      comment: comment || null,
    })

    setStatus(error ? 'error' : 'sent')
  }

  if (status === 'sent') {
    return (
      <div className="max-w-[560px] mx-auto px-6 sm:px-8 py-16 text-center">
        <div className="text-3xl mb-3">🙏</div>
        <h1 className="font-display font-extrabold text-3xl mb-2">Thanks for testing VeriTix</h1>
        <p className="text-ink-soft">Your feedback genuinely helps shape what gets built next.</p>
      </div>
    )
  }

  return (
    <div className="max-w-[560px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
      <h1 className="font-display font-extrabold text-4xl mb-3">How was it?</h1>
      <p className="text-ink-soft mb-10">
        Whether you bought a ticket, scanned one, or just clicked around — tell us what felt
        confusing or broken. Takes 30 seconds.
      </p>

      <div className="border-2 border-ink rounded-card bg-white p-6 sm:p-8 shadow-hard">
        <label className="block text-xs font-mono text-ink-soft mb-2">
          Overall experience
        </label>
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`w-11 h-11 rounded-full border-2 border-ink font-display font-bold text-sm ${
                rating >= n ? 'bg-soft-green' : 'bg-white'
              }`}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              {n}
            </button>
          ))}
        </div>

        <label className="block text-xs font-mono text-ink-soft mb-1">
          What felt confusing or broken? (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full border-2 border-ink rounded-lg px-3 py-2.5 mb-4"
        />

        <label className="block text-xs font-mono text-ink-soft mb-1">
          Email you tested with (optional, helps us follow up)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="[email protected]"
          className="w-full border-2 border-ink rounded-lg px-3 py-2.5 mb-6"
        />

        {status === 'error' && (
          <p className="text-xs text-taupe mb-3">Something went wrong — try again?</p>
        )}

        <button
          onClick={submit}
          disabled={!rating || status === 'sending'}
          className="w-full bg-taupe text-white px-6 py-3.5 rounded-pill font-semibold border-2 border-ink shadow-hard-sm disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending…' : 'Send feedback'}
        </button>
      </div>
    </div>
  )
}


