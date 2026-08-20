import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const stalkColors = ["#2f5a2a", "#3a6b33", "#265020", "#46743a"];

const Stalk = ({ position, height, tilt, color, phase }) => {
  const ref = useRef();
  useFrame(({ clock }) => {
    ref.current.rotation.z = tilt + Math.sin(clock.getElapsedTime() * 0.6 + phase) * 0.018;
  });
  return (
    <group position={position}>
      <group ref={ref} rotation={[0, 0, tilt]}>
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[0.045, 0.07, height, 7]} />
          <meshStandardMaterial color={color} roughness={0.65} />
        </mesh>
        {[0, 1].map((i) => (
          <mesh
            key={i}
            position={[0, height - 0.2 - i * 0.4, 0]}
            rotation={[Math.PI / 2.1, i * 2.4, 0.35]}
          >
            <coneGeometry args={[0.04, 1.7, 3]} />
            <meshStandardMaterial color="#4d8040" roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const Field = () => {
  const stalks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 20;
      const z = -1.8 - Math.random() * 9;
      if (Math.abs(x) < 1.4 && z > -4) continue;
      arr.push({
        position: [x, 0, z],
        height: 3 + Math.random() * 2.8,
        tilt: (Math.random() - 0.5) * 0.12,
        color: stalkColors[i % stalkColors.length],
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);
  return (
    <group>
      {stalks.map((s, i) => (
        <Stalk key={i} {...s} />
      ))}
    </group>
  );
};

const Product = () => (
  <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.8}>
    <group position={[0, 1.05, 0]}>
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.34, 0.27, 1.05, 48]} />
        <meshStandardMaterial color="#b95d15" emissive="#8a3d08" emissiveIntensity={0.5} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.345, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 48]} />
        <meshStandardMaterial color="#d9822b" emissive="#a3540f" emissiveIntensity={0.4} roughness={0.15} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.42, 0.33, 1.55, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#e8f4ec"
          transparent
          opacity={0.16}
          roughness={0.06}
          metalness={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, -0.76, 0]}>
        <cylinderGeometry args={[0.33, 0.3, 0.08, 48]} />
        <meshPhysicalMaterial color="#e8f4ec" transparent opacity={0.35} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.775, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.41, 0.012, 12, 60]} />
        <meshPhysicalMaterial color="#f4fff6" transparent opacity={0.4} roughness={0.05} />
      </mesh>
      <mesh position={[0.3, 0.5, 0]} rotation={[0, 0, -0.42]}>
        <cylinderGeometry args={[0.032, 0.032, 1.9, 8]} />
        <meshStandardMaterial color="#8fbf6a" roughness={0.5} />
      </mesh>
    </group>
  </Float>
);

const Rig = () => {
  useFrame(({ camera, pointer }) => {
    camera.position.x += (pointer.x * 0.9 - camera.position.x) * 0.04;
    camera.position.y += (1.5 + pointer.y * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 1, 0);
  });
  return null;
};

export const CaneScene = () => (
  <div data-testid="hero-3d-scene" className="absolute inset-0">
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.5, 7], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#0A100C", 8, 18]} />
      <ambientLight intensity={0.5} color="#ffe9d0" />
      <directionalLight position={[6, 7, 4]} intensity={1.6} color="#ffb26b" />
      <directionalLight position={[-7, 4, -5]} intensity={0.7} color="#7fae56" />
      <pointLight position={[0, 2.2, 3]} intensity={12} distance={9} color="#C86A23" />
      <Suspense fallback={null}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <circleGeometry args={[22, 48]} />
          <meshStandardMaterial color="#0d1710" roughness={1} />
        </mesh>
        <Field />
        <Product />
        <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={14} blur={2.6} far={4} color="#000000" />
      </Suspense>
      <Rig />
    </Canvas>
  </div>
);
