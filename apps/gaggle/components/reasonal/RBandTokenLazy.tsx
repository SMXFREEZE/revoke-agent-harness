"use client";

import dynamic from "next/dynamic";
import { BandTokenBoundary } from "./BandTokenBoundary";

// ssr:false keeps the WebGL canvas out of the server render + hydration pass,
// so it can never throw during SSR or mismatch on hydrate.
const RBandToken = dynamic(() => import("./RBandToken"), { ssr: false });

type Props = { url?: string };

export function RBandTokenLazy({ url }: Props) {
  return (
    <div className="rz-band__token">
      <BandTokenBoundary
        fallback={
          // eslint-disable-next-line @next/next/no-img-element
          <img className="rz-band__token-fallback" src="/band/glass-ball-7.png" alt="" aria-hidden />
        }
      >
        <RBandToken url={url} />
      </BandTokenBoundary>
    </div>
  );
}

export default RBandTokenLazy;
