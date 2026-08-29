"use client";

import dynamic from "next/dynamic";
import { BandTokenBoundary } from "./BandTokenBoundary";
import { withBasePath } from "@/lib/utils/base-path";

// ssr:false keeps the WebGL canvas out of server render + hydration.
const RGoose = dynamic(() => import("./RGoose"), { ssr: false });

export function RGooseLazy() {
  return (
    <div className="rz-band__token">
      <BandTokenBoundary
        fallback={
          // eslint-disable-next-line @next/next/no-img-element
          <img className="rz-band__token-fallback" src={withBasePath("/favicon.svg")} alt="" aria-hidden />
        }
      >
        <RGoose />
      </BandTokenBoundary>
    </div>
  );
}

export default RGooseLazy;
