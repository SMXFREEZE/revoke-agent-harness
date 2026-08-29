"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// A premium spinning vinyl record. The top face is a procedurally drawn canvas
// texture: black grooves + a brand-green centre label carrying the Tulum DJ
// Academy identity (soundwave + wordmark). Idle-spins like a turntable; drag to
// scratch it faster or backspin it. Lights only, so the Suspense never hangs.

function makeVinylTexture(): THREE.CanvasTexture {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const cx = S / 2;
  const cy = S / 2;
  const R = S / 2;

  // black disc
  ctx.fillStyle = "#0b0b0c";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  // concentric grooves
  for (let r = R * 0.34; r < R * 0.99; r += 2.3) {
    const g = 16 + Math.round(11 * Math.sin(r * 0.32));
    ctx.strokeStyle = `rgba(${g + 12},${g + 16},${g + 12},0.55)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // soft radial sheen
  ctx.globalCompositeOperation = "lighter";
  const sheen = ctx.createLinearGradient(0, 0, S, S);
  sheen.addColorStop(0, "rgba(120,255,200,0.06)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(80,200,255,0.05)");
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.99, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // brand-green label
  const lr = R * 0.34;
  const lg = ctx.createLinearGradient(cx - lr, cy - lr, cx + lr, cy + lr);
  lg.addColorStop(0, "#2cff92");
  lg.addColorStop(0.5, "#00d084");
  lg.addColorStop(1, "#00c1c0");
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.arc(cx, cy, lr, 0, Math.PI * 2);
  ctx.fill();

  // soundwave motif near the top of the label
  ctx.save();
  ctx.translate(cx, cy - lr * 0.46);
  const bars = 27;
  const span = lr * 1.25;
  const bw = span / bars;
  ctx.fillStyle = "rgba(4,42,30,0.9)";
  for (let i = 0; i < bars; i++) {
    const x = -span / 2 + i * bw;
    const h = (Math.sin(i * 0.85) * 0.5 + 0.5) * lr * 0.32 + 4;
    ctx.fillRect(x, -h / 2, bw * 0.46, h);
  }
  ctx.restore();

  // wordmark
  ctx.fillStyle = "#042a1e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(lr * 0.44)}px Montserrat, Arial, sans-serif`;
  ctx.fillText("TULUM", cx, cy + lr * 0.04);
  ctx.font = `800 ${Math.round(lr * 0.17)}px Montserrat, Arial, sans-serif`;
  ctx.fillText("DJ ACADEMY", cx, cy + lr * 0.42);

  // spindle hole
  ctx.fillStyle = "#050506";
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.018, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Vinyl() {
  const { gl } = useThree();
  const tilt = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);
  const spin = useRef({ vel: 1.0, active: false, lastX: 0 });

  const tex = useMemo(() => makeVinylTexture(), []);
  const materials = useMemo(() => {
    const edge = new THREE.MeshPhysicalMaterial({
      color: "#0a0a0b",
      metalness: 0.5,
      roughness: 0.34,
      clearcoat: 0.7,
      clearcoatRoughness: 0.3,
    });
    const face = new THREE.MeshPhysicalMaterial({
      map: tex,
      metalness: 0.42,
      roughness: 0.46,
      clearcoat: 0.65,
      clearcoatRoughness: 0.35,
    });
    return [edge, face, edge];
  }, [tex]);

  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      spin.current.active = true;
      spin.current.lastX = e.clientX;
    };
    const move = (e: PointerEvent) => {
      if (!spin.current.active) return;
      const dx = e.clientX - spin.current.lastX;
      spin.current.lastX = e.clientX;
      spin.current.vel = THREE.MathUtils.clamp(spin.current.vel + dx * 0.05, -14, 14);
    };
    const up = () => {
      spin.current.active = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    // ease angular velocity back to a gentle idle spin when released
    if (!spin.current.active) spin.current.vel += (1.0 - spin.current.vel) * 0.018;
    // spin in the record's own plane (always face-on, never edge-on)
    if (spinner.current) spinner.current.rotation.z += spin.current.vel * dt;
    // a gentle 3D lean + organic wobble
    if (tilt.current) {
      tilt.current.rotation.x = -0.32 + Math.sin(t * 0.4) * 0.04;
      tilt.current.rotation.y = Math.sin(t * 0.3) * 0.06;
    }
  });

  return (
    <group ref={tilt} rotation={[-0.32, 0, 0]}>
      <group ref={spinner}>
        <mesh material={materials} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.62, 1.62, 0.07, 128]} />
        </mesh>
      </group>
    </group>
  );
}

export default function RVinyl() {
  return (
    <Canvas
      frameloop="always"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.25, 5.2], fov: 38, near: 0.1, far: 100 }}
      style={{ width: "100%", height: "100%", display: "block", cursor: "grab" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1.7} />
      <directionalLight position={[-4, 2, -2]} intensity={0.5} color="#7df0c0" />
      <pointLight position={[0, -2, 3]} intensity={1.2} color="#00c1c0" distance={12} />
      <pointLight position={[2, 3, 2]} intensity={0.8} color="#b6ff6a" distance={12} />
      <Vinyl />
    </Canvas>
  );
}
