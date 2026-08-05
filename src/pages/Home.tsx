import { useState } from 'react'
import { Link } from 'react-router-dom'
import TicketStub from '../components/TicketStub'
import ActivityTicker from '../components/ActivityTicker'

const wallTickets = [
  { eventName: 'Sunburn Goa', subtitle: 'EDM Fest', ticketNo: '3391', tier: 'GA', accent: 'blue' as const },
  { eventName: 'Kashiyatra', subtitle: 'VIT Vellore', ticketNo: '7710', tier: 'DAY 2', accent: 'green' as const },
  { eventName: 'Riviera', subtitle: 'BITS Pilani', ticketNo: '2245', tier: 'GA', accent: 'beige' as const },
  { eventName: 'Antaragni', subtitle: 'IIT Kanpur', ticketNo: '9081', tier: '3-DAY', accent: 'blue' as const },
  { eventName: 'Spring Fest', subtitle: 'IIT Kharagpur', ticketNo: '4456', tier: 'GA', accent: 'green' as const },
  { eventName: 'Enigma', subtitle: "IIT Bombay '26", ticketNo: '1187', tier: 'GA', accent: 'beige' as const },
]

const steps = [
  { n: '01', title: 'Organizer mints', body: 'Every ticket becomes a unique on-chain asset tied to the event and seat.' },
  { n: '02', title: 'You buy, silently', body: 'A wallet gets created behind the scenes. You just see a QR ticket.' },
  { n: '03', title: 'Resell, capped', body: 'The contract enforces a max 20% markup. No side deals possible.' },
  { n: '04', title: 'Scan at the gate', body: 'Staff scan your QR, ownership confirms on-chain, done in seconds.' },
]

export default function Home() {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'verified'>('idle')

  const runScan = () => {
    if (scanState !== 'idle') return
    setScanState('scanning')
    setTimeout(() => setScanState('verified'), 900)
    setTimeout(() => setScanState('idle'), 3200)
  }

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#C5C6C7 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] bg-soft-green/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 -left-32 w-[360px] h-[360px] bg-pale-blue/60 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-[1120px] mx-auto px-6 sm:px-8 pt-6 sm:pt-10">
          <div className="grid md:grid-cols-[1fr_1fr] gap-8 items-center pb-10">
            <div>
              <div className="flex gap-2 mb-7 flex-wrap">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] px-3 py-1.5 rounded-pill border-2 border-ink bg-soft-green whitespace-nowrap shadow-hard-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink animate-pulse" /> live on stellar
                </span>
                <span className="font-mono text-[11.5px] px-3 py-1.5 rounded-pill border-2 border-ink whitespace-nowrap bg-beige shadow-hard-sm">
                  zero gas shock
                </span>
              </div>
              <h1 className="font-display font-extrabold tracking-tight mb-6 leading-[0.98] sm:leading-[0.94]">
                <span className="block text-[40px] sm:text-[56px] md:text-[72px]">Scalpers</span>
                <span className="block text-[40px] sm:text-[56px] md:text-[72px]">hate this</span>
                <span className="relative inline-block mt-1">
                  <span className="relative z-10 bg-ink text-white px-4 pb-1.5 -rotate-2 inline-block text-[40px] sm:text-[56px] md:text-[72px]">
                    one ticket
                  </span>
                  <span className="absolute -bottom-2 -right-3 -z-0 w-full h-full bg-soft-green rounded-lg -rotate-2" />
                </span>
              </h1>
              <p className="text-lg text-ink-soft max-w-[420px] mb-9 leading-relaxed">
                Every VeriTix ticket is minted on-chain and locked to one real owner — bots,
                screenshots, and 5x WhatsApp resales don't work anymore.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <Link
                  to="/events"
                  className="whitespace-nowrap inline-flex items-center gap-2 bg-taupe text-white px-8 py-4 rounded-pill font-semibold text-[15px] border-2 border-ink shadow-hard hover:shadow-hard-sm hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                >
                  Browse events <span aria-hidden>→</span>
                </Link>
                <Link
                  to="/organizer"
                  className="whitespace-nowrap inline-flex items-center bg-white px-7 py-[15px] rounded-pill font-semibold text-[15px] border-2 border-ink hover:bg-line/30 transition-colors"
                >
                  List your fest
                </Link>
              </div>
            </div>

            <div className="relative h-[300px] sm:h-[380px] md:h-[440px] flex items-center justify-center">
              <div className="relative w-full flex items-center justify-center scale-[0.5] sm:scale-[0.85] md:scale-[1.05]">
                <TicketStub
                  eventName={'NH7 Weekender'}
                  subtitle="Prateek Kuhad"
                  ticketNo="0472"
                  tier="GA"
                  accent="blue"
                  rotateClass="absolute -rotate-[16deg] -translate-x-10 sm:-translate-x-20 md:-translate-x-24 translate-y-6"
                />
                <TicketStub
                  eventName={'College Fest Pass'}
                  subtitle="Enigma '26"
                  ticketNo="1187"
                  tier="3-DAY"
                  accent="green"
                  rotateClass="absolute rotate-[10deg] translate-x-8 sm:translate-x-16 md:translate-x-20 -translate-y-4"
                />
                <button
                  onClick={runScan}
                  className={`absolute -rotate-3 focus:outline-none transition-transform duration-300 ${
                    scanState === 'scanning' ? 'scale-105' : ''
                  }`}
                  aria-label="Tap to simulate scanning this ticket"
                >
                  <TicketStub
                    eventName={'Mood Indigo — Live on Lawns'}
                    subtitle={
                      scanState === 'verified'
                        ? '✓ verified'
                        : scanState === 'scanning'
                        ? 'scanning…'
                        : 'tap to scan'
                    }
                    ticketNo="8821"
                    tier="GA"
                    accent="beige"
                    verified={scanState === 'verified'}
                  />
                  {scanState === 'scanning' && (
                    <span className="absolute inset-0 rounded-card border-2 border-ink animate-ping" />
                  )}
                </button>
              </div>
              <span className="absolute bottom-0 sm:bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] sm:text-[11px] text-ink-soft whitespace-nowrap">
                ↑ tap the front ticket
              </span>
            </div>
          </div>
        </div>
      </section>

      <ActivityTicker />

      {/* TICKET WALL */}
      <section className="border-b-2 border-ink bg-white py-8 overflow-hidden">
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8 mb-4 flex items-center justify-between">
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-ink-soft">
            Live on the network right now
          </span>
          <span className="font-mono text-[11px] text-ink-soft hidden sm:inline">
            scroll to browse →
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 sm:px-8 pb-2 snap-x snap-mandatory">
          {wallTickets.map((t) => (
            <div key={t.ticketNo} className="snap-start shrink-0 scale-[0.8] origin-top-left">
              <TicketStub {...t} />
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section
        className="relative bg-line/25 pt-16 sm:pt-20 pb-20 sm:pb-28"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 48px), 0 100%)' }}
      >
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8">
          <h2 className="font-display font-extrabold text-[28px] sm:text-[34px] md:text-[40px] tracking-tight max-w-[680px] mb-10 leading-[1.1]">
            Coldplay Mumbai sold out in minutes.
            <br />
            What followed on WhatsApp had <span className="text-taupe">zero rules.</span>
          </h2>
          <div className="grid md:grid-cols-5 gap-5">
            <div className="md:col-span-3 p-6 sm:p-8 border-2 border-ink rounded-card bg-white">
              <div className="font-mono text-xs font-semibold mb-4 text-ink-soft">01 — RIGHT NOW</div>
              <h3 className="font-display font-bold text-2xl mb-3">Untraceable resale</h3>
              <p className="text-[15px] text-ink-soft max-w-[380px]">
                Tickets change hands in Telegram groups with no way to check the seller actually
                owns them.
              </p>
            </div>
            <div className="md:col-span-2 p-6 sm:p-8 border-2 border-ink rounded-card bg-pale-blue">
              <div className="font-mono text-xs font-semibold mb-4">02 — RIGHT NOW</div>
              <h3 className="font-display font-bold text-2xl mb-3">Bots buy in bulk</h3>
              <p className="text-[15px] text-ink/70">₹500 tickets flipped for 5–10x within the hour.</p>
            </div>
            <div className="md:col-span-2 p-6 sm:p-8 border-2 border-ink rounded-card bg-beige">
              <div className="font-mono text-xs font-semibold mb-4">03 — VERITIX</div>
              <h3 className="font-display font-bold text-2xl mb-3">One owner, provable</h3>
              <p className="text-[15px] text-ink/70">Ownership lives on-chain, verifiable up front.</p>
            </div>
            <div className="md:col-span-3 p-6 sm:p-8 border-2 border-ink rounded-card bg-soft-green">
              <div className="font-mono text-xs font-semibold mb-4">04 — VERITIX</div>
              <h3 className="font-display font-bold text-2xl mb-3">Resale, hard-capped at 20%</h3>
              <p className="text-[15px] text-ink/70 max-w-[380px]">
                Not a promise — the contract itself refuses any transfer priced above the cap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative bg-ink text-white pt-16 sm:pt-24 pb-20 sm:pb-28 -mt-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#FFFFFF 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative max-w-[1120px] mx-auto px-6 sm:px-8">
          <h2 className="font-display font-extrabold text-[28px] sm:text-3xl md:text-4xl tracking-tight mb-12 sm:mb-16">
            From mint to gate, four steps
          </h2>
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px border-t-2 border-dashed border-white/20" />
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {steps.map((s, i) => (
                <div
                  key={s.n}
                  className={`relative flex flex-col items-center text-center ${
                    i % 2 === 1 ? 'md:mt-16' : 'md:mb-16'
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center font-display font-extrabold text-xl mb-4 relative z-10 ${
                      i === 3 ? 'bg-soft-green text-ink border-soft-green' : 'bg-ink border-white/40'
                    }`}
                  >
                    {s.n}
                  </div>
                  <h4 className="font-semibold text-[15px] mb-2">{s.title}</h4>
                  <p className="text-[13px] text-white/55 max-w-[190px]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS band */}
      <section className="bg-white border-b-2 border-ink">
        <div className="max-w-[1120px] mx-auto px-6 sm:px-8 py-8 sm:py-10 grid grid-cols-3">
          {[
            ['<5s', 'gate verification'],
            ['20%', 'hard resale cap'],
            ['₹0', 'gas fee shock'],
          ].map(([n, label], i) => (
            <div key={label} className={`text-center px-1 ${i !== 2 ? 'border-r-2 border-line' : ''}`}>
              <b className="font-display font-extrabold text-2xl sm:text-4xl md:text-5xl block mb-1">{n}</b>
              <span className="font-mono text-[9px] sm:text-xs text-ink-soft uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="relative bg-taupe text-white py-16 sm:py-24 px-6 sm:px-8 text-center overflow-hidden">
        <div className="absolute -bottom-24 -right-24 w-[300px] h-[300px] bg-soft-green/20 rounded-full blur-[90px]" />
        <div className="absolute -top-24 -left-24 w-[300px] h-[300px] bg-pale-blue/20 rounded-full blur-[90px]" />
        <div className="relative">
          <h2 className="font-display font-extrabold text-[28px] sm:text-[36px] md:text-[46px] tracking-tight mb-4 leading-[1.1]">
            Bring VeriTix to your fest
          </h2>
          <p className="text-white/70 max-w-[440px] mx-auto mb-9">
            We're piloting with college fest committees and regional promoters first.
          </p>
          <Link
            to="/organizer"
            className="whitespace-nowrap inline-flex items-center gap-2 bg-beige text-ink px-8 py-4 rounded-pill font-semibold text-[15px] border-2 border-ink shadow-hard hover:shadow-hard-sm hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            Talk to us <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </>
  )
}