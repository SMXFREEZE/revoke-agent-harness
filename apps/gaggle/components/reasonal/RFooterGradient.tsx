"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

/** Flowing red "mesh gradient" (waterPlane fills the frame) behind the dark
 *  footer card. Deep near-black red -> crimson -> warm orange so it reads rich
 *  and dark enough to keep the white footer text legible (a scrim sits on top). */
export default function RFooterGradient() {
  return (
    <ShaderGradientCanvas
      style={{ width: "100%", height: "100%" }}
      pixelDensity={1}
      pointerEvents="none"
      lazyLoad={false}
      fov={undefined}
    >
      <ShaderGradient
        animate="on"
        type="waterPlane"
        shader="defaults"
        uSpeed={0.32}
        uStrength={1.6}
        uDensity={1.4}
        uFrequency={0}
        uAmplitude={0}
        positionX={0}
        positionY={0}
        positionZ={0}
        rotationX={50}
        rotationY={0}
        rotationZ={-60}
        cAzimuthAngle={180}
        cPolarAngle={80}
        cDistance={2.8}
        cameraZoom={9.1}
        color1="#03130c"
        color2="#0ea96b"
        color3="#52f0a8"
        reflection={0.1}
        brightness={1.2}
        lightType="3d"
        grain="on"
        toggleAxis={false}
        zoomOut={false}
        enableTransition={false}
      />
    </ShaderGradientCanvas>
  );
}
