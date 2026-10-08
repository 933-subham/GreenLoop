import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Line, Trail } from '@react-three/drei';
import * as THREE from 'three';

// 1. Digital Earth
const DigitalEarth = () => {
    const earthRef = useRef();
    
    useFrame(({ clock }) => {
        if (earthRef.current) {
            earthRef.current.rotation.y = clock.elapsedTime * 0.1;
        }
    });

    return (
        <group ref={earthRef}>
            {/* Core Sphere */}
            <mesh>
                <icosahedronGeometry args={[1.5, 3]} />
                <meshStandardMaterial 
                    color="#020617" 
                    emissive="#064e3b"
                    emissiveIntensity={0.5}
                    wireframe={true}
                    transparent
                    opacity={0.3}
                />
            </mesh>
            
            {/* Inner glow */}
            <mesh>
                <sphereGeometry args={[1.45, 32, 32]} />
                <meshStandardMaterial 
                    color="#020617"
                    emissive="#0ea5e9"
                    emissiveIntensity={0.2}
                    roughness={0.8}
                />
            </mesh>

            {/* Smart City Nodes & Connections */}
            <NetworkConnections radius={1.5} />
            
            {/* Surface Tech - Wind Turbines */}
            <group rotation={[Math.PI / 4, 0, 0]}>
                <WindTurbine position={[0, 1.5, 0]} scale={0.15} />
            </group>
            <group rotation={[-Math.PI / 3, Math.PI / 2, 0]}>
                <WindTurbine position={[0, 1.5, 0]} scale={0.15} />
            </group>
            <group rotation={[Math.PI / 6, -Math.PI / 1.5, 0]}>
                <WindTurbine position={[0, 1.5, 0]} scale={0.15} />
            </group>
        </group>
    );
};

// 2. Wind Turbine Component
const WindTurbine = ({ position, scale = 1 }) => {
    const bladesRef = useRef();
    
    useFrame(({ clock }) => {
        if (bladesRef.current) {
            bladesRef.current.rotation.z = clock.elapsedTime * 2;
        }
    });

    return (
        <group position={position} scale={scale}>
            {/* Pole */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.05, 0.1, 1, 8]} />
                <meshStandardMaterial color="#cbd5e1" emissive="#ffffff" emissiveIntensity={0.2} />
            </mesh>
            {/* Rotor / Hub */}
            <mesh position={[0, 1, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            {/* Blades */}
            <group ref={bladesRef} position={[0, 1, 0.2]}>
                {[0, 1, 2].map((i) => (
                    <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} position={[0, 0, 0]}>
                        {/* Offset blade so it spins around the hub */}
                        <boxGeometry args={[0.05, 1.2, 0.02]} />
                        <meshStandardMaterial color="#f8fafc" emissive="#38bdf8" emissiveIntensity={0.5} />
                    </mesh>
                ))}
            </group>
            {/* Base glowing light */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshBasicMaterial color="#34d399" />
            </mesh>
        </group>
    );
};

// 3. Network Connections
const NetworkConnections = ({ radius }) => {
    // Generate random nodes on the sphere surface
    const nodeCount = 15;
    const nodes = useMemo(() => {
        const pts = [];
        for (let i = 0; i < nodeCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / nodeCount);
            const theta = Math.sqrt(nodeCount * Math.PI) * phi;
            pts.push(new THREE.Vector3(
                radius * Math.cos(theta) * Math.sin(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                radius * Math.cos(phi)
            ));
        }
        return pts;
    }, [radius, nodeCount]);

    // Create curve connections between close nodes
    const curves = useMemo(() => {
        const lines = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (nodes[i].distanceTo(nodes[j]) < radius * 1.5) {
                    // Create an arc between nodes
                    const mid = nodes[i].clone().lerp(nodes[j], 0.5).normalize().multiplyScalar(radius * 1.2);
                    const curve = new THREE.QuadraticBezierCurve3(nodes[i], mid, nodes[j]);
                    lines.push(curve.getPoints(20));
                }
            }
        }
        return lines;
    }, [nodes, radius]);

    return (
        <group>
            {/* Nodes */}
            {nodes.map((pos, i) => (
                <mesh key={i} position={pos}>
                    <sphereGeometry args={[0.05, 8, 8]} />
                    <meshBasicMaterial color="#34d399" />
                </mesh>
            ))}
            
            {/* Connecting Lines */}
            {curves.map((pts, i) => (
                <Line 
                    key={i} 
                    points={pts} 
                    color="#4ade80" 
                    lineWidth={1.5} 
                    transparent 
                    opacity={0.4} 
                />
            ))}
        </group>
    );
};

// 4. Rotating Eco-Leaf Ring
const EcoLeafRing = () => {
    const ringRef = useRef();
    
    const leafCount = 8;
    const radius = 2.5;

    useFrame(({ clock }) => {
        if (ringRef.current) {
            ringRef.current.rotation.z = clock.elapsedTime * 0.5;
            ringRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.2;
            ringRef.current.rotation.y = Math.cos(clock.elapsedTime * 0.3) * 0.2;
        }
    });

    // Simple Leaf Shape
    const leafShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(0.5, 0.5, 1, 0);
        shape.quadraticCurveTo(0.5, -0.5, 0, 0);
        return shape;
    }, []);

    return (
        <group ref={ringRef}>
            {/* Glowing Ring Path */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[radius, 0.01, 16, 64]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
            </mesh>

            {/* Leaves distributed around the ring */}
            {Array.from({ length: leafCount }).map((_, i) => {
                const angle = (i / leafCount) * Math.PI * 2;
                return (
                    <group 
                        key={i} 
                        position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}
                        rotation={[0, 0, angle + Math.PI / 2]}
                    >
                        {/* Center the leaf shape */}
                        <mesh position={[-0.5, 0, 0]} scale={0.3}>
                            <shapeGeometry args={[leafShape]} />
                            <meshStandardMaterial 
                                color="#a3e635" 
                                emissive="#4ade80"
                                emissiveIntensity={1.5}
                                side={THREE.DoubleSide}
                                transparent
                                opacity={0.9}
                            />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
};

const SmartCityLoader = () => {
    return (
        <div style={{ 
            height: '100vh', 
            width: '100vw', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            background: 'radial-gradient(circle at center, #022c22 0%, #020617 60%, #000000 100%)', // Smart city dark gradient
            color: 'white',
            overflow: 'hidden'
        }}>
            <div style={{ height: '400px', width: '100%', maxWidth: '600px', cursor: 'pointer' }}>
                <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={2} color="#bae6fd" />
                    <pointLight position={[0, 0, 0]} intensity={2} color="#34d399" distance={10} />
                    
                    <Stars radius={100} depth={20} count={1500} factor={3} saturation={0.8} fade speed={1} />
                    
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                        <DigitalEarth />
                        <EcoLeafRing />
                    </Float>
                    
                    <OrbitControls 
                        enableZoom={false} 
                        enablePan={false} 
                        autoRotate={true} 
                        autoRotateSpeed={0.8} 
                        maxPolarAngle={Math.PI / 1.5} 
                        minPolarAngle={Math.PI / 3}
                    />
                </Canvas>
            </div>
            
            <div className="text-center mt-4 position-relative z-1" style={{ animation: 'fadeIn 2s ease-in' }}>
                <h2 className="fw-bold mb-2" style={{ 
                    letterSpacing: '4px', 
                    fontFamily: '"Rajdhani", "Inter", sans-serif',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(to right, #34d399, #38bdf8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 30px rgba(56, 189, 248, 0.4)'
                }}>
                    EcoGrid Online
                </h2>
                <div className="d-flex align-items-center justify-content-center gap-3 mt-3">
                    <div className="spinner-border spinner-border-sm" role="status" style={{color: '#34d399', width: '1rem', height: '1rem'}}></div>
                    <p className="mb-0" style={{ letterSpacing: '2px', fontSize: '0.85rem', color: '#bae6fd', opacity: 0.8, textTransform: 'uppercase' }}>
                        Connecting Smart Cities...
                    </p>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
};

export default SmartCityLoader;
