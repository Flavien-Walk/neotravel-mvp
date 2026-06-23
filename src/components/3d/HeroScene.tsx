'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'

// Approximate France geographic positions (normalized to scene units)
const CITIES = [
  { id: 0, name: 'Paris',      pos: [ 0.10,  1.10,  0.10] as [number,number,number], r: 0.13, hub: true  },
  { id: 1, name: 'Lyon',       pos: [ 0.70,  0.10,  0.20] as [number,number,number], r: 0.09, hub: false },
  { id: 2, name: 'Marseille',  pos: [ 0.80, -0.90,  0.10] as [number,number,number], r: 0.09, hub: false },
  { id: 3, name: 'Bordeaux',   pos: [-0.65, -0.15,  0.30] as [number,number,number], r: 0.08, hub: false },
  { id: 4, name: 'Nantes',     pos: [-0.85,  0.65,  0.20] as [number,number,number], r: 0.07, hub: false },
  { id: 5, name: 'Lille',      pos: [ 0.15,  1.85, -0.10] as [number,number,number], r: 0.07, hub: false },
  { id: 6, name: 'Toulouse',   pos: [-0.05, -0.85,  0.20] as [number,number,number], r: 0.07, hub: false },
  { id: 7, name: 'Nice',       pos: [ 1.20, -0.65,  0.05] as [number,number,number], r: 0.07, hub: false },
  { id: 8, name: 'Strasbourg', pos: [ 1.30,  0.80, -0.10] as [number,number,number], r: 0.07, hub: false },
]

const ROUTES = [
  [0, 1], [0, 3], [0, 4], [0, 5], [0, 8],
  [1, 2], [1, 7], [1, 8],
  [2, 7], [2, 6],
  [3, 6], [3, 4],
]

function RouteParticle({
  start, end, offset = 0,
}: {
  start: THREE.Vector3
  end: THREE.Vector3
  offset?: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  const progress = useRef(offset)

  useFrame((_, delta) => {
    if (!ref.current) return
    progress.current = (progress.current + delta * 0.28) % 1
    ref.current.position.lerpVectors(start, end, progress.current)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.022, 6, 6]} />
      <meshBasicMaterial color="#F59E0B" transparent opacity={0.85} />
    </mesh>
  )
}

function CityNode({ pos, r, hub }: { pos: [number,number,number]; r: number; hub: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const phase   = useRef(Math.random() * Math.PI * 2)

  useFrame((_, delta) => {
    phase.current += delta * 1.4
    if (coreRef.current) coreRef.current.scale.setScalar(1 + Math.sin(phase.current) * 0.08)
    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.1 + Math.sin(phase.current * 0.9) * 0.06
      haloRef.current.scale.setScalar(1 + Math.sin(phase.current * 0.7 + 1) * 0.12)
    }
  })

  return (
    <group position={pos}>
      <mesh ref={haloRef}>
        <sphereGeometry args={[r * 2.8, 8, 8]} />
        <meshBasicMaterial color={hub ? '#F59E0B' : '#2563EB'} transparent opacity={0.1} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[r, 14, 14]} />
        <meshBasicMaterial color={hub ? '#FBBF24' : '#60A5FA'} />
      </mesh>
    </group>
  )
}

function Scene() {
  const { pointer } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const reducedMotion = useReducedMotion()

  useFrame((_, delta) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y += delta * 0.06
    groupRef.current.rotation.x +=
      (pointer.y * 0.06 - groupRef.current.rotation.x) * 0.04
  })

  const vecs = useMemo(() => CITIES.map(c => new THREE.Vector3(...c.pos)), [])

  return (
    <group ref={groupRef}>
      {ROUTES.map(([a, b], i) => (
        <Line
          key={`line-${i}`}
          points={[CITIES[a].pos, CITIES[b].pos]}
          color="#2563EB"
          lineWidth={0.6}
          transparent
          opacity={0.18}
        />
      ))}
      {ROUTES.map(([a, b], i) => (
        <RouteParticle
          key={`p${i}`}
          start={vecs[a]}
          end={vecs[b]}
          offset={(i * 0.37) % 1}
        />
      ))}
      {CITIES.map(c => (
        <CityNode key={c.id} pos={c.pos} r={c.r} hub={c.hub} />
      ))}
    </group>
  )
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 5.5], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <Scene />
    </Canvas>
  )
}
