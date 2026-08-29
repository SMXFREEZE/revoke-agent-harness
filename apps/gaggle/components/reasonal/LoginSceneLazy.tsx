"use client";

import dynamic from "next/dynamic";
import { BandTokenBoundary } from "./BandTokenBoundary";

// ssr:false keeps the WebGL canvas out of server render/hydration; the error
// boundary falls back to the plain sky so a WebGL failure never breaks login.
const LoginScene = dynamic(() => import("./LoginScene"), { ssr: false });

export function LoginSceneLazy() {
  return (
    <div className="login-intro__scene" aria-hidden>
      <BandTokenBoundary fallback={null}>
        <LoginScene />
      </BandTokenBoundary>
    </div>
  );
}

export default LoginSceneLazy;
