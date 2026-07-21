import { Link } from 'react-router-dom'
import TicketStub from '../components/TicketStub'
import ActivityTicker from '../components/ActivityTicker'

export default function Home() {
  return (
    <>
      <section className="max-w-[1120px] mx-auto px-8">
        <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-10 items-center pb-14">
          <div>
            <div className="flex gap-2 mb-6 flex-wrap">
              <span className="font-mono text-[11.5px] px-3 py-1.5 rounded-pill border-[1.5px] border-ink bg-lime">
                ● live on stellar
              </span>
              <span className="font-mono text-[11.5px] px-3 py-1.5 rounded-pill border-[1.5px] border-ink">
                zero gas shock
              </span>
            </div>
            <h1 className="font-display font-extrabold text-6xl leading-[0.98] tracking-tight mb-5">
              Scalpers hate
              <br />
              this{' '}
              <span className="inline-block bg-ink text-white px-3 pb-1 -rotate-2">
                one ticket
              </span>
              <span className="text-coral">.</span>
            </h1>
            <p className="text-lg text-ink-soft max-w-[420px] mb-8 leading-relaxed">
              Every VeriTix ticket is minted on-chain and locked to one real owner — so bots,
              screenshots, and 5x WhatsApp resales don't work anymore.
            </p>
            <div className="flex gap-3.5 items-center mb-10">
              <Link
                to="/events"
                className="bg-coral text-white px-7 py-[15px] rounded-pill font-semibold text-[15px] border-2 border-ink shadow-hard"
              >
                Browse events →
              </Link>
              <Link
                to="/organizer"
                className="px-6 py-[13px] rounded-pill font-semibold text-[15px] border-2 border-ink"
              >
                List your fest
              </Link>
            </div>
            <div className="flex border-t-2 border-ink">
              {[
                ['<5s', 'gate verification'],
                ['20%', 'hard resale cap'],
                ['₹0', 'gas fee shock'],
              ].map(([n, label]) => (
                <div key={label} className="flex-1 pt-4 border-r-2 border-ink last:border-r-0 pr-4">
                  <b className="font-display font-extrabold text-2xl block">{n}</b>
                  <span className="font-mono text-xs text-ink-soft">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[460px] flex items-center justify-center">
            <TicketStub
              eventName={'NH7 Weekender'}
              subtitle="Prateek Kuhad"
              ticketNo="0472"
              tier="GA"
              accent="cobalt"
              rotateClass="absolute -rotate-[11deg] -translate-x-9 translate-y-2.5"
            />
            <TicketStub
              eventName={"College Fest Pass"}
              subtitle="Enigma '26"
              ticketNo="1187"
              tier="3-DAY"
              accent="lime"
              rotateClass="absolute rotate-6 translate-x-7 -translate-y-1.5"
            />
            <TicketStub
              eventName={'Mood Indigo — Live on Lawns'}
              subtitle="✓ verified"
              ticketNo="8821"
              tier="GA"
              accent="coral"
              rotateClass="absolute -rotate-2"
              verified
            />
          </div>
        </div>

        <ActivityTicker />
      </section>

      <section className="max-w-[1120px] mx-auto px-8 pt-16 pb-10">
        <h2 className="font-display font-extrabold text-4xl tracking-tight max-w-[640px] mb-12 leading-tight">
          Coldplay Mumbai sold out in minutes. What followed on WhatsApp had zero rules.
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="p-6 border-2 border-ink rounded-card bg-coral-dim">
            <div className="font-mono text-xs font-semibold mb-3.5">01 — RIGHT NOW</div>
            <h3 className="font-display font-bold text-lg mb-2">Untraceable resale</h3>
            <p className="text-sm opacity-75">
              Tickets change hands in Telegram groups with no way to check the seller actually
              owns them.
            </p>
          </div>
          <div className="p-6 border-2 border-ink rounded-card bg-coral-dim">
            <div className="font-mono text-xs font-semibold mb-3.5">02 — RIGHT NOW</div>
            <h3 className="font-display font-bold text-lg mb-2">Bots buy in bulk</h3>
            <p className="text-sm opacity-75">
              Real fans lose out in seconds; ₹500 tickets get flipped for 5–10x within the hour.
            </p>
          </div>
          <div className="p-6 border-2 border-ink rounded-card bg-lime">
            <div className="font-mono text-xs font-semibold mb-3.5">03 — VERITIX</div>
            <h3 className="font-display font-bold text-lg mb-2">One owner, always provable</h3>
            <p className="text-sm opacity-75">
              Resale is capped at 20% by the smart contract itself — not a promise, a rule that
              can't be broken.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-[1120px] mx-auto px-8 pt-14 pb-24">
        <h2 className="font-display font-extrabold text-4xl tracking-tight mb-11">
          From mint to gate, four steps
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['01', 'Organizer mints', 'Every ticket becomes a unique on-chain asset tied to the event and seat.'],
            ['02', 'You buy, silently', 'A wallet gets created behind the scenes. You just see a QR ticket.'],
            ['03', 'Resell, capped', 'The contract enforces a max 20% markup. No side deals possible.'],
            ['04', 'Scan at the gate', 'Staff scan your QR, ownership confirms on-chain, done in seconds.'],
          ].map(([n, title, body]) => (
            <div key={n} className="border-2 border-ink rounded-card p-5">
              <div className="font-display font-extrabold text-3xl text-coral mb-3.5">{n}</div>
              <h4 className="font-semibold text-[15px] mb-2">{title}</h4>
              <p className="text-[13px] text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cobalt text-white py-24 px-8 text-center">
        <h2 className="font-display font-extrabold text-[42px] tracking-tight mb-4">
          Bring VeriTix to your fest
        </h2>
        <p className="text-[#D6DAFF] max-w-[440px] mx-auto mb-8">
          We're piloting with college fest committees and regional promoters first.
        </p>
        <Link
          to="/organizer"
          className="bg-lime text-ink px-7 py-[15px] rounded-pill font-semibold text-[15px] border-2 border-ink shadow-hard inline-block"
        >
          Talk to us →
        </Link>
      </section>
    </>
  )
}
