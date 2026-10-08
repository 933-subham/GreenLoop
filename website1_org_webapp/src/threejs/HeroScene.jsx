import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Float, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Floating Eco Icon (bin/recycle symbol box)
function EcoBox({ position, color, scale = 1, speed = 1 }) {
    const meshRef = useRef();
    useFrame((state) => {
        meshRef.current.rotation.y += 0.01 * speed;
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 * speed) * 0.15;
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed + position[0]) * 0.15;
    });
    return (
        <mesh ref={meshRef} position={position} scale={scale} castShadow>
            <boxGeometry args={[1, 1.4, 1]} />
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
        </mesh>
    );
}

// Earth Globe
function Globe() {
    const meshRef = useRef();
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 512, 256);
        grad.addColorStop(0, '#1a6b3c');
        grad.addColorStop(0.3, '#2d9e54');
        grad.addColorStop(0.5, '#1565c0');
        grad.addColorStop(0.7, '#2d9e54');
        grad.addColorStop(1, '#1a6b3c');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 256);
        // Landmass-like patches
        ctx.fillStyle = '#3dba6a';
        [[80, 60, 130, 80], [220, 80, 80, 60], [300, 120, 100, 70], [60, 140, 90, 50], [380, 60, 90, 80]].forEach(([x, y, w, h]) => {
            ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0.3, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = '#1e40af';
        [[180, 90, 200, 120], [350, 150, 180, 100]].forEach(([x, y, w, h]) => {
            ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, -0.2, 0, Math.PI * 2); ctx.fill();
        });
        return new THREE.CanvasTexture(canvas);
    }, []);

    useFrame(() => { meshRef.current.rotation.y += 0.004; });
    return (
        <mesh ref={meshRef} position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[2, 64, 64]} />
            <meshStandardMaterial map={texture} roughness={0.55} metalness={0.05} />
        </mesh>
    );
}

// Atmospheric glow ring
function GlowRing() {
    const ringRef = useRef();
    useFrame(() => { ringRef.current.rotation.z += 0.002; });
    return (
        <mesh ref={ringRef} position={[0, 0, 0]} rotation={[Math.PI / 6, 0, 0]}>
            <torusGeometry args={[2.6, 0.04, 16, 100]} />
            <meshStandardMaterial color="#28a745" emissive="#28a745" emissiveIntensity={1.5} transparent opacity={0.5} />
        </mesh>
    );
}

// Orbiting particles
function OrbitParticles({ count = 50 }) {
    const points = useRef();
    const positions = useMemo(() => {
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = 3.2 + (Math.random() - 0.5) * 0.8;
            arr[i * 3] = Math.cos(angle) * radius;
            arr[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
            arr[i * 3 + 2] = Math.sin(angle) * radius;
        }
        return arr;
    }, [count]);
    useFrame(() => { points.current.rotation.y += 0.003; });
    return (
        <points ref={points}>
            <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry>
            <pointsMaterial size={0.06} color="#20c997" transparent opacity={0.8} sizeAttenuation />
        </points>
    );
}

// Main Scene
function Scene() {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[8, 8, 5]} intensity={1.4} castShadow />
            <pointLight position={[-5, 3, -3]} color="#28a745" intensity={0.8} />
            <pointLight position={[5, -3, 3]} color="#20c997" intensity={0.5} />

            <Stars radius={60} depth={30} count={800} factor={4} saturation={0.2} fade />

            <Globe />
            <GlowRing />
            <OrbitParticles count={60} />

            <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.8}>
                <EcoBox position={[-3.6, 0.5, 0.5]} color="#2d9e54" scale={0.55} speed={0.8} />
            </Float>
            <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
                <EcoBox position={[3.4, -0.3, -0.5]} color="#17a2b8" scale={0.45} speed={1.2} />
            </Float>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <EcoBox position={[0.5, 2.8, -1]} color="#ffc107" scale={0.38} speed={1.5} />
            </Float>
        </>
    );
}

export default function HeroScene() {
    return (
        <Canvas
            camera={{ position: [0, 0.5, 7], fov: 52 }}
            style={{ width: '100%', height: '100%' }}
            shadows
            gl={{ antialias: true, alpha: true }}
        >
            <Scene />
            <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.6}
                maxPolarAngle={Math.PI * 0.65}
                minPolarAngle={Math.PI * 0.35}
            />
        </Canvas>
    );
}
