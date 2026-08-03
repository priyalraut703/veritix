import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-6 max-w-[1120px] mx-auto">
      <Link to="/" className="font-display font-extrabold text-2xl flex items-center gap-2">
        <span className="inline-block w-3.5 h-3.5 bg-taupe rotate-45" />
        VeriTix
      </Link>
      <div className="hidden md:flex gap-8 text-sm font-medium text-ink-soft">
        <Link to="/events">Browse events</Link>
        <Link to="/organizer">For organizers</Link>
        <Link to="/verify">Verify a ticket</Link>
      </div>
      <Link
        to="/events"
        className="text-sm font-semibold px-5 py-[11px] bg-ink text-white rounded-pill whitespace-nowrap"
      >
        Get tickets
      </Link>
    </nav>
  )
}