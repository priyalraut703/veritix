import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="relative flex items-center justify-between px-6 sm:px-8 py-6 max-w-[1120px] mx-auto">
      <Link to="/" className="font-display font-extrabold text-2xl flex items-center gap-2">
        <span className="inline-block w-3.5 h-3.5 bg-taupe rotate-45" />
        VeriTix
      </Link>
      <div className="hidden md:flex gap-8 text-sm font-medium text-ink-soft">
        <Link to="/events">Browse events</Link>
        <Link to="/organizer">For organizers</Link>
        <Link to="/verify">Verify a ticket</Link>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/events"
          className="hidden sm:inline-block text-sm font-semibold px-5 py-[11px] bg-ink text-white rounded-pill whitespace-nowrap"
        >
          Get tickets
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden w-10 h-10 flex items-center justify-center border-2 border-ink rounded-full"
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-paper border-2 border-ink rounded-card mx-6 mt-2 p-5 flex flex-col gap-4 shadow-hard-sm z-50">
          <Link to="/events" onClick={() => setOpen(false)} className="font-semibold">Browse events</Link>
          <Link to="/organizer" onClick={() => setOpen(false)} className="font-semibold">For organizers</Link>
          <Link to="/verify" onClick={() => setOpen(false)} className="font-semibold">Verify a ticket</Link>
          <Link
            to="/events"
            onClick={() => setOpen(false)}
            className="text-center text-sm font-semibold px-5 py-3 bg-ink text-white rounded-pill"
          >
            Get tickets
          </Link>
        </div>
      )}
    </nav>
  )
}
