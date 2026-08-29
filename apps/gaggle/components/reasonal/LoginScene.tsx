"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Clone, useGLTF, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";

// The intro's signature: four DIFFERENT glassy figures drifting on a bright sky
// (square star token, hexagon star token, ring, and a star-in-glass orb). They
// sit BEHIND a frosted form, so the glass reads through it.
type ItemDef = {
  url: string;
  kind: "ball" | "token";
  pos: [number, number, number];
  size: number;
  spin: number;
  bob: number;
  phase: number;
};

const SQUARE_URL = "/models/tokens/token-05-rounded-star.glb";
const HEX_URL = "/models/tokens/token-06-hex-star.glb";
const RING_URL = "/models/tokens/token-08-ring.glb";
const ORB_URL = "/models/glass-spheres/glass-orb-with-star.glb";
const ITEMS: ItemDef[] = [
  // square star token, upper-left
  { url: SQUARE_URL, kind: "token", pos: [-2.5, 1.6, -0.3], size: 1.15, spin: 0, bob: 0.5, phase: 0 },
  // hexagon star token, upper-right
  { url: HEX_URL, kind: "token", pos: [2.7, 1.1, -1.4], size: 1.12, spin: 0, bob: 0.6, phase: 1.6 },
  // star-in-glass orb, lower-left
  { url: ORB_URL, kind: "ball", pos: [-2.3, -1.9, -0.7], size: 0.85, spin: 0.18, bob: 0.45, phase: 3.1 },
  // ring, lower-right
  { url: RING_URL, kind: "token", pos: [2.4, -2.0, 0.2], size: 0.82, spin: 0, bob: 0.5, phase: 4.4 },
];
const URLS = Array.from(new Set(ITEMS.map((b) => b.url)));

function Item({ url, kind, pos, size, spin, bob, phase }: ItemDef) {
  const { scene } = useGLTF(url) as unknown as { scene: THREE.Object3D };
  const grp = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const n = useMemo(() => {
    const s = scene.clone(true);
    s.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(s);
    const c = box.getCenter(new THREE.Vector3());
    const r = box.getBoundingSphere(new THREE.Sphere()).radius || 1;
    return { object: s, cx: c.x, cy: c.y, cz: c.z, r };
  }, [scene]);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (grp.current) grp.current.position.y = pos[1] + Math.sin(t * 0.5 + phase) * bob;
    const i = inner.current;
    if (!i) return;
    if (kind === "token") {
      // flat extruded mark: rock/tumble within bounds so it never sits edge-on
      i.rotation.y = Math.sin(t * 0.4 + phase) * 0.85; // +/- ~49deg
      i.rotation.x = Math.sin(t * 0.33 + phase) * 0.6; // +/- ~34deg
      i.rotation.z = Math.sin(t * 0.27 + phase) * 0.08;
    } else {
      i.rotation.y += spin * dt;
      i.rotation.x = Math.sin(t * 0.3 + phase) * 0.16;
    }
  });
  return (
    <group ref={grp} position={pos}>
      <group ref={inner} scale={size / n.r}>
        <group position={[-n.cx, -n.cy, -n.cz]}>
          <Clone object={n.object} />
        </group>
      </group>
    </group>
  );
}

// Pulls the camera back on narrow/portrait screens so the objects stay in frame.
function Rig() {
  const { camera, size } = useThree();
  useFrame(() => {
    const aspect = size.width / size.height;
    const targetZ = aspect < 1 ? 7 + (1 / aspect - 1) * 3.4 : 7;
    camera.position.z += (targetZ - camera.position.z) * 0.08;
  });
  return null;
}

export default function LoginScene() {
  return (
    <Canvas
      frameloop="always"
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 9], fov: 42 }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} />
      <directionalLight position={[-4, -1, -3]} intensity={0.5} />
      <directionalLight position={[0, 2, -4]} intensity={0.4} color="#ffe1c0" />
      <Suspense fallback={null}>
        <Environment resolution={256} frames={1}>
          <color attach="background" args={["#eaf6ff"]} />
          <Lightformer intensity={2.4} color="#ffffff" position={[0, 5, -3]} scale={[12, 6, 1]} />
          <Lightformer intensity={1.6} color="#bfe3f7" position={[-6, 1, -1]} scale={[8, 8, 1]} />
          <Lightformer intensity={1.3} color="#ffe1a6" position={[6, -1, 2]} scale={[5, 5, 1]} />
          <Lightformer intensity={1.4} color="#ffffff" position={[0, -4, 1]} scale={[12, 4, 1]} />
        </Environment>
        {ITEMS.map((b, i) => (
          <Item key={i} {...b} />
        ))}
      </Suspense>
      <Rig />
    </Canvas>
  );
}

URLS.forEach((u) => useGLTF.preload(u));
