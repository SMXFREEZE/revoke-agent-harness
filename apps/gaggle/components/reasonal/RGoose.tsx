"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// A simple probiotic capsule (the product), in soft-clay 3D. Deliberately
// simple, a clean two-tone pill, idle float + slow spin, drag to rotate.

const LIME = "#b6ff6a", CREAM = "#eafff0";

function Capsule() {
  const grp = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const drag = useRef({ on: false, lastX: 0, targetY: 0.6, velY: 0 });

  const onDown = (e: any) => { drag.current.on = true; drag.current.lastX = e.clientX ?? 0; gl.domElement.style.cursor = "grabbing"; };
  const onUp = () => { drag.current.on = false; gl.domElement.style.cursor = "grab"; };
  const onMove = (e: any) => {
    if (drag.current.on) { drag.current.velY += (e.clientX - drag.current.lastX) * 0.008; drag.current.lastX = e.clientX; }
  };

  useFrame((state) => {
    const g = grp.current, d = drag.current; if (!g) return;
    const t = state.clock.elapsedTime;
    d.targetY += d.on ? 0 : 0.004;
    d.targetY += d.velY; d.velY *= 0.9;
    g.rotation.y += (d.targetY - g.rotation.y) * 0.08;
    g.position.y = Math.sin(t * 1.2) * 0.14;
  });

  const lime = (rough = 0.34) => <meshStandardMaterial color={LIME} roughness={rough} metalness={0.06} />;
  const cream = (rough = 0.34) => <meshStandardMaterial color={CREAM} roughness={rough} metalness={0.04} />;

  return (
    <group ref={grp} rotation={[0.5, 0.6, 0.42]} onPointerDown={onDown} onPointerUp={onUp} onPointerLeave={onUp} onPointerMove={onMove}>
      {/* bottom half (lime) */}
      <mesh position={[0, -0.27, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.54, 48]} />
        {lime()}
      </mesh>
      <mesh position={[0, -0.54, 0]}>
        <sphereGeometry args={[0.72, 48, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        {lime()}
      </mesh>
      {/* top half (cream) */}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.54, 48]} />
        {cream()}
      </mesh>
      <mesh position={[0, 0.54, 0]}>
        <sphereGeometry args={[0.72, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {cream()}
      </mesh>
    </group>
  );
}

export default function RGoose() {
  return (
    <Canvas
      frameloop="always"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.2, 5.4], fov: 38, near: 0.1, far: 100 }}
      style={{ width: "100%", height: "100%", display: "block", cursor: "grab" }}
    >
      <ambientLight intensity={0.6} color="#eafff6" />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <pointLight position={[-3, 1, -3]} intensity={1.8} color="#2cff92" distance={30} />
      <pointLight position={[3, 2, 3]} intensity={0.9} color="#b6ff6a" distance={20} />
      <Capsule />
    </Canvas>
  );
}
