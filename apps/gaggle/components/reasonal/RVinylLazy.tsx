"use client";

import dynamic from "next/dynamic";
import { BandTokenBoundary } from "./BandTokenBoundary";

// ssr:false keeps the WebGL canvas out of server render + hydration.
const RVinyl = dynamic(() => import("./RVinyl"), { ssr: false });

export function RVinylLazy() {
  return (
    <div className="rz-band__token">
      <BandTokenBoundary
        fallback={
          // eslint-disable-next-line @next/next/no-img-element
          <img className="rz-band__token-fallback" src="/favicon.svg" alt="" aria-hidden />
        }
      >
        <RVinyl />
      </BandTokenBoundary>
    </div>
  );
}

export default RVinylLazy;
