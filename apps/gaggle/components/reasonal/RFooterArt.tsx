"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const loadGradient = () => import("./RFooterGradient");
const Gradient = dynamic(loadGradient, {
  ssr: false,
  loading: () => null,
});

/** Mounts the footer mesh gradient as soon as the page opens (client mount) on
 *  BOTH mobile and desktop. The chunk download is kicked off immediately and
 *  lazyLoad is off on the canvas, so the mesh renders off-screen during the
 *  initial load and is already painted by the time the user reaches the footer. */
export function RFooterArt() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    loadGradient(); // start downloading the WebGL chunk with the rest of the UI
    setShow(true);
  }, []);

  return (
    <div className="rz-footer__gradient" aria-hidden>
      {show ? <Gradient /> : null}
      <span className="rz-footer__gradient-scrim" />
    </div>
  );
}
