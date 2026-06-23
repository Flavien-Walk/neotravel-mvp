'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, Line, Float } from '@react-three/drei'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'

function Node({ position, color, index }: { position: THREE.Vector3; color: string; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 1.2 + Math.sin(clock.getElapsedTime() * 1.5 + index * 0.7) * 0.6
  })

  return (
    <Float speed={1.2} floatIntensity={0.3} rotationIntensity={0}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.95} />
      </mesh>
    </Float>
  )
}

function PulseRing({ position }: { position: THREE.Vector3 }) {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ringRef.current) return
    const t = clock.getElapsedTime()
    const scale = 1 + Math.sin(t * 1.5) * 0.3
    ringRef.current.scale.setScalar(scale)
    const mat = ringRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.15 - Math.sin(t * 1.5) * 0.1
  })

  return (
    <mesh ref={ringRef} position={position}>
      <ringGeometry args={[0.12, 0.18, 32]} />
      <meshBasicMaterial color="#4B8EF8" transparent opacity={0.15} side={THREE.DoubleSide} />
    </mesh>
  )
}

function RouteNetwork({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const { pointer } = useThree()

  const nodes = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = 16
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * i
      pts.push(new THREE.Vector3(Math.cos(theta) * r * 3.2, y * 3.2, Math.sin(theta) * r * 3.2))
    }
    return pts
  }, [])

  const connections = useMemo(() => {
    const pairs: [THREE.Vector3, THREE.Vector3][] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 3.2) {
          pairs.push([nodes[i], nodes[j]])
        }
      }
    }
    return pairs
  }, [nodes])

  const nodeColors = ['#93C5FD', '#4B8EF8', '#22D3EE', '#60A5FA', '#93C5FD', '#22D3EE']

  useFrame(({ clock }) => {
    if (!groupRef.current || reduced) return
    const t = clock.getElapsedTime()
    groupRef.current.rotation.y = t * 0.035 + pointer.x * 0.18
    groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.08 + pointer.y * 0.1
  })

  return (
    <group ref={groupRef}>
      {nodes.map((pos, i) => (
        <Node key={i} position={pos} color={nodeColors[i % nodeColors.length]} index={i} />
      ))}
      {nodes.filter((_, i) => i % 3 === 0).map((pos, i) => (
        <PulseRing key={i} position={pos} />
      ))}
      {connections.map(([a, b], i) => (
        <Line
          key={i}
          points={[a, b]}
          color="#4B8EF8"
          lineWidth={reduced ? 0.3 : 0.5}
          transparent
          opacity={0.18}
        />
      ))}
      <Stars radius={9} depth={5} count={reduced ? 100 : 350} factor={0.7} saturation={0.1} fade speed={reduced ? 0 : 0.4} />
    </group>
  )
}

function Fallback() {
  return (
    <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
      Réseau de trajets
    </div>
  )
}

export default function HeroScene() {
  const reduced = useReducedMotion() ?? false

  return (
    <Suspense fallback={<Fallback />}>
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.15} />
        <pointLight position={[5, 5, 5]} color="#4B8EF8" intensity={3.5} />
        <pointLight position={[-5, -3, -5]} color="#22D3EE" intensity={1.8} />
        <pointLight position={[0, 0, 3]} color="#818CF8" intensity={0.8} />
        <RouteNetwork reduced={reduced} />
      </Canvas>
    </Suspense>
  )
}
