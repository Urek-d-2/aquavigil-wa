import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { waveHeight, siteToWorld, sev } from "./data.js";

const SEV_COLOR = { good: "#2FA36B", warn: "#E8A317", crit: "#E5484D" };

function Water() {
  const ref = useRef();
  const geom = useMemo(() => new THREE.PlaneGeometry(11, 8, 48, 36), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, waveHeight(pos.getX(i), pos.getY(i), t));
    }
    pos.needsUpdate = true;
    ref.current.geometry.computeVertexNormals();
  });
  return (
    <mesh ref={ref} geometry={geom} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#0E5A66" metalness={0.35} roughness={0.35} transparent opacity={0.94} />
    </mesh>
  );
}

function Marker({ site, selected, warn, crit, onSelect }) {
  const [X, Z] = siteToWorld(site);
  const g = useRef();
  const level = sev(site.maxLatest, warn, crit);
  const color = SEV_COLOR[level];
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = waveHeight(X, -Z, clock.getElapsedTime());
  });
  return (
    <group ref={g} position={[X, 0, Z]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.5, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh
        position={[0, 0.4, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(site.id); }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <sphereGeometry args={[selected ? 0.28 : 0.22, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.7 : 0.4} />
      </mesh>
      {level !== "good" && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.42, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Html position={[0, 0.85, 0]} center distanceFactor={9} zIndexRange={[10, 0]}>
        <div className={"m3d " + (selected ? "sel" : "")} onClick={() => onSelect(site.id)}>
          <b>{site.name}</b>
          <span>{site.maxLatest.toFixed(1)}×</span>
        </div>
      </Html>
    </group>
  );
}

export default function WaterMap({ sites, selected, warn, crit, onSelect }) {
  return (
    <Canvas camera={{ position: [0, 5.5, 6.5], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={["#071b20"]} />
      <fog attach="fog" args={["#071b20", 11, 20]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.15} />
      <Water />
      {sites.map((s) => (
        <Marker key={s.id} site={s} selected={s.id === selected} warn={warn} crit={crit} onSelect={onSelect} />
      ))}
      <OrbitControls
        enablePan={false}
        minPolarAngle={0.35}
        maxPolarAngle={1.2}
        minDistance={5}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </Canvas>
  );
}
