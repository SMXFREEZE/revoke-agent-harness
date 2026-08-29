"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Clone, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { withBasePath } from "@/lib/utils/base-path";

type Props = { url?: string };

const DEFAULT_URL = withBasePath("/models/x-movement-logo-3d.glb?v=2");

/**
 * The logo is a flat-ish extruded mark, so a full 360 spin shows an ugly
 * edge-on slab. Instead it gently ROCKS around the front (always recognisable,
 * just enough tilt to read as 3D). Drag/swipe spins it freely; on release it
 * glides with momentum then eases back to facing the viewer. Lights only (no
 * Environment) so the Suspense never hangs.
 */
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { gl } = useThree();
  const group = useRef<THREE.Group>(null);
  const drag = useRef({ active: false, lastX: 0, vel: 0, offset: 0 });

  const { object, scale } = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    root.position.sub(sphere.center);
    const radius = sphere.radius > 0 ? sphere.radius : 1;
    return { object: root, scale: 1 / radius };
  }, [scene]);

  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      drag.current.active = true;
      drag.current.lastX = e.clientX;
      drag.current.vel = 0;
    };
    const move = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.lastX;
      drag.current.lastX = e.clientX;
      const d = dx * 0.009;
      drag.current.offset += d;
      drag.current.vel = d;
    };
    const up = () => {
      drag.current.active = false;
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

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const D = drag.current;
    if (!D.active) {
      D.offset += D.vel; // momentum glide
      D.vel *= 0.93;
      if (Math.abs(D.vel) < 0.0025) {
        // settle to the nearest front-facing orientation (shortest path)
        const TWO = Math.PI * 2;
        const target = Math.round(D.offset / TWO) * TWO;
        D.offset += (target - D.offset) * 0.05;
      }
    }
    // lively free tumble: generous left/right + up/down ~45deg, organic (the
    // different frequencies keep it from ever sitting flat edge-on)
    const rockY = Math.sin(t * 0.45) * 0.85; // +/- ~49deg horizontal
    g.rotation.y = rockY + D.offset;
    g.rotation.x = Math.sin(t * 0.33) * 0.7; // +/- ~40deg up/down
    g.rotation.z = Math.sin(t * 0.27) * 0.08; // tiny roll
  });

  return (
    <group ref={group} scale={scale}>
      <Clone object={object} />
    </group>
  );
}

export default function RBandToken({ url = DEFAULT_URL }: Props) {
  return (
    <Canvas
      frameloop="always"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.15, 3.3], fov: 38, near: 0.1, far: 100 }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <directionalLight position={[-4, -1, -3]} intensity={0.6} />
      <directionalLight position={[0, 2, -4]} intensity={0.5} color="#ffe1c0" />
      <Suspense fallback={null}>
        <Model url={url} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(DEFAULT_URL);
