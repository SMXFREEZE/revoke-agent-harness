import Link from "next/link";
import { BRAND, CONTACT } from "@/lib/data/site";
import { RFooterArt } from "./RFooterArt";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#steps" },
      { label: "The live report", href: "/console" },
      { label: "Built for agents", href: "/#agents" },
      { label: "Your report explained", href: "/#disciplines" },
    ],
  },
  {
    title: "More",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: CONTACT.email, href: `mailto:${CONTACT.email}` },
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/ggg-logo-wide.png" alt="GutGutGoose" style={{ height: 40 }} />
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
          <span>Probiotics matched to your gut DNA.</span>
        </div>
      </div>
    </footer>
  );
}
