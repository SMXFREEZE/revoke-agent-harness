import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { BRAND, NAV_LINKS, APP_LINKS } from "@/lib/data/site";

const COLS = [
  {
    title: "Explore",
    links: NAV_LINKS,
  },
  {
    title: "Platform",
    links: [
      { label: "Watch Now", href: APP_LINKS.watch.href },
      { label: "Community", href: APP_LINKS.community.href },
      { label: "Teacher Resources", href: APP_LINKS.teachers.href },
      { label: "Log in", href: APP_LINKS.login.href },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Watch a class", href: "/watch" },
      { label: "Community", href: APP_LINKS.community.href },
    ],
  },
];

export function Footer() {
  return (
    <footer className="footer on-ink">
      <div className="shell">
        <div className="footer__cta">
          <AnimatedText
            text={"Let's get the\nwhole room moving."}
            by="line"
            as="h2"
            className="display h-1 footer__cta-title"
          />
          <p className="lede" style={{ maxWidth: "42ch" }}>
            Login, find a video, press play. Energizing, evidence-based movement for the
            classroom or home, no training required.
          </p>
          <div className="row wrap gap-m" style={{ marginTop: "0.6rem" }}>
            <ShimmerButton href={APP_LINKS.watch.href} variant="sun" size="lg">
              Watch Now →
            </ShimmerButton>
            <Button href={APP_LINKS.teachers.href} variant="white" size="lg">
              Teacher Resources
            </Button>
          </div>
        </div>

        <div className="footer__grid">
          <div className="footer__brand">
            <Logo onDark height={36} />
            <p className="footer__tagline">{BRAND.tagline}</p>
          </div>
          {COLS.map((col) => (
            <nav className="footer__col" aria-label={col.title} key={col.title}>
              <span className="footer__col-h">{col.title}</span>
              {col.links.map((l) => (
                <Link key={l.label} href={l.href} className="footer__link">
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="footer__base">
          <span>© {BRAND.year} X Movement Inc. All rights reserved.</span>
          <span>Happy. Healthy. Moving.</span>
        </div>
      </div>
    </footer>
  );
}
