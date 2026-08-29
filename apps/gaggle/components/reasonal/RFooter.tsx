import Link from "next/link";
import { BRAND, CONTACT } from "@/lib/data/site";
import { RFooterArt } from "./RFooterArt";

const COLS = [
  {
    title: "The run",
    links: [
      { label: "How it works", href: "/#steps" },
      { label: "Agent courtroom", href: "/#agents" },
      { label: "Independent roles", href: "/#disciplines" },
      { label: "Belief revision", href: "/#science" },
    ],
  },
  {
    title: "More",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Public source", href: "https://github.com/SMXFREEZE/revoke-agent-harness" },
      { label: "Qodo review", href: "https://github.com/SMXFREEZE/revoke-agent-harness/pull/1" },
    ],
  },
];

export function RFooter() {
  return (
    <footer className="rz-footer">
      <div className="rz-footer__card">
        <RFooterArt />
        <div className="rz-footer__top">
          <div className="rz-footer__brand">
            <span className="rz-footer__logo">
              <span className="rz-gaggle-logo rz-gaggle-logo--footer" aria-label="The Gaggle"><b>THE</b><strong>GAGGLE</strong></span>
            </span>
            <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: "30ch", fontSize: 15 }}>
              {BRAND.blurb}
            </p>
          </div>

          <div className="rz-footer__cols">
            {COLS.map((c) => (
              <nav className="rz-footer__col" key={c.title} aria-label={c.title}>
                <h4>{c.title}</h4>
                {c.links.map((l) =>
                  l.href.startsWith("http") || l.href.startsWith("mailto") || l.href.startsWith("tel") ? (
                    <a key={l.label} href={l.href}>
                      {l.label}
                    </a>
                  ) : (
                    <Link key={l.label} href={l.href}>
                      {l.label}
                    </Link>
                  ),
                )}
              </nav>
            ))}
          </div>
        </div>

        <div className="rz-footer__base">
          <span>© {BRAND.year} {BRAND.full}. {CONTACT.location}</span>
          <span>Adversarial microbiome R&amp;D, with a human scientist in control.</span>
        </div>
      </div>
    </footer>
  );
}
