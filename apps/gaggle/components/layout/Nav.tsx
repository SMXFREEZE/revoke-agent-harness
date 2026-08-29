"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { NAV_LINKS, APP_LINKS } from "@/lib/data/site";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className={`nav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="nav__inner shell">
        <Link href="/" className="nav__brand" aria-label="X Movement Classroom, home">
          <Logo height={32} />
        </Link>

        <nav className="nav__links only-desktop" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav__link" data-active={isActive(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav__actions only-desktop">
          <Link href={APP_LINKS.login.href} className="nav__link">
            Login
          </Link>
          <Button href={APP_LINKS.watch.href} variant="primary" arrow>
            Watch Now
          </Button>
        </div>

        <button
          className="nav__burger only-mobile"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span style={{ transform: open ? "translateY(4px) rotate(45deg)" : "none" }} />
          <span style={{ opacity: open ? 0 : 1 }} />
          <span style={{ transform: open ? "translateY(-4px) rotate(-45deg)" : "none" }} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nav__sheet"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="nav__sheet-link">
                {l.label}
              </Link>
            ))}
            <Link href={APP_LINKS.login.href} className="nav__sheet-link">
              Login
            </Link>
            <Link href={APP_LINKS.watch.href} className="btn btn--primary" style={{ marginTop: "0.5rem" }}>
              Watch Now →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
