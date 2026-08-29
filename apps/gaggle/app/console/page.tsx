import type { Metadata } from "next";
import { RReport } from "@/components/reasonal/RReport";

export const metadata: Metadata = {
  title: "Live console",
  description: "Run the MetaScope engine on a shotgun-metagenomic sample and read your gut report, live.",
};

// A dedicated, shareable full-page console for the live report, reusing the same
// RReport component. The marketing page keeps an inline version; this is the
// product-feeling standalone the nav CTA opens. The site nav/footer come from
// the root layout, so this page is just the focused report.
export default function ConsolePage() {
  return (
    <div className="rz rz-console">
      <RReport />
    </div>
  );
}
