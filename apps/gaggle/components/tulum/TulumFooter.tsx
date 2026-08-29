import { BRAND, CONTACT, SOCIALS, NAV_LINKS } from "@/lib/data/site";

export function TulumFooter() {
  return (
    <footer className="tdj-footer">
      <div className="tdj-footer__glow" aria-hidden />
      <div className="tdj-wrap tdj-footer__inner">
        <div className="tdj-footer__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/tulum-logo.webp" alt="Tulum DJ Academy" />
          <p>{BRAND.blurb}</p>
        </div>

        <div>
          <h4>Explore</h4>
          <ul>
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
            <li><a href="#book">Book a consultation</a></li>
          </ul>
        </div>

        <div>
          <h4>Connect</h4>
          <ul>
            <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
            <li><a href={CONTACT.phoneHref}>{CONTACT.phone}</a></li>
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="tdj-wrap tdj-footer__bottom">
        <span>© {BRAND.year} {BRAND.full}. {CONTACT.location}.</span>
        <span>The only DJ school in Tulum.</span>
      </div>
    </footer>
  );
}
