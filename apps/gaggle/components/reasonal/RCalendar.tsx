import { RWordReveal } from "./reveal";
import { CALENDAR } from "@/lib/data/site";

export function RCalendar() {
  return (
    <section className="rz-sec" id="calendar">
      <div className="rz-card-w">
        <div className="rz-cal">
          <header className="rz-cal__head">
            <span className="rz-eyebrow">Where you&rsquo;ll record</span>
            <RWordReveal as="h2" className="rz-h2" text="Set recordings in breathtaking places." />
            <p className="rz-body-text">
              We film your set in the most beautiful spots in Tulum, locations, gear and editing handled.
            </p>
          </header>

          <div className="rz-cal__grid">
            {CALENDAR.map((c) => (
              <article className="rz-cal__card" key={c.id}>
                <div className="rz-cal__media" data-reveal>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.art} alt="" loading="lazy" />
                  <span className="rz-cal__date">{c.date}</span>
                </div>
                <div className="rz-cal__body">
                  <h3 className="rz-cal__name">{c.name}</h3>
                  <p className="rz-cal__blurb">{c.blurb}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
