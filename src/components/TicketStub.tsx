type TicketStubProps = {
  eventName: string
  subtitle: string
  ticketNo: string
  tier?: string
  accent?: 'coral' | 'cobalt' | 'lime'
  verified?: boolean
  rotateClass?: string
}

const accentMap = {
  coral: 'bg-coral-dim',
  cobalt: 'bg-cobalt-dim',
  lime: 'bg-lime',
}

/**
 * TicketStub is VeriTix's signature component: every ticket in the app
 * (wallet, resale listing, gate-scan result) renders through this so the
 * "physical ticket stub" identity stays consistent everywhere.
 */
export default function TicketStub({
  eventName,
  subtitle,
  ticketNo,
  tier = 'GA',
  accent = 'coral',
  verified = false,
  rotateClass = '',
}: TicketStubProps) {
  return (
    <div
      className={`relative w-[270px] border-[2.5px] border-ink rounded-card p-[22px] shadow-hard ${accentMap[accent]} ${rotateClass}`}
    >
      <div className="font-mono text-[10.5px] uppercase tracking-wide mb-2 text-ink-soft">
        {subtitle}
      </div>
      <div className="font-display font-bold text-xl leading-tight mb-3.5">{eventName}</div>
      <div className="flex justify-between items-center perf-divider pt-3 font-mono text-[11px]">
        <span>{tier}</span>
        <span>#{ticketNo}</span>
      </div>
      {verified && (
        <div className="absolute -bottom-2 -right-1.5 bg-ink text-white font-mono text-[11px] font-semibold px-3.5 py-2 rounded-pill flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
          on-chain match
        </div>
      )}
    </div>
  )
}
