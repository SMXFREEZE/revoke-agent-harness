import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./tailwind.css"; // Tailwind (preflight OFF) — first so existing .rz rules win every tie
import "./globals.css";
import "./pages.css";
import "./aceternity.css";
import "./playful.css";
import "./premium.css";
import "./neon.css";
import "atropos/atropos.css";
import "./reasonal.css";
import "./inner-premium.css"; // inner-page premium chrome — loaded last so it refines base classes
import "./console.css"; // Lexie Console glass system (scoped to .cc) for the report panel
import "./rreport.css"; // the report generation slot

import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { RNav } from "@/components/reasonal/RNav";
import { RFooter } from "@/components/reasonal/RFooter";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { BRAND } from "@/lib/data/site";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
/* Elegant warm serif for accent words — unifies the premium feel with the
   intro (x-movement-intro), our friendly answer to noomo's serif display. */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smxfreeze.github.io/revoke-agent-harness/"),
  title: {
    default: `${BRAND.full}, ${BRAND.tagline}`,
    template: `%s · ${BRAND.full}`,
  },
  description: BRAND.blurb,
  openGraph: {
    title: `${BRAND.full}, ${BRAND.tagline}`,
    description: BRAND.blurb,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#eaf6ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jakarta.variable} ${fraunces.variable}`}>
      <body className="rz-body">
        <CustomCursor />
        <SmoothScroll>
          <PlayerProvider>
            <RNav />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <RFooter />
          </PlayerProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
