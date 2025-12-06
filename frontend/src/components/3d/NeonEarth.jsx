import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Float } from '@react-three/drei';
import * as THREE from 'three';

function NeonEarth() {
    const earthRef = useRef();
    const cloudsRef = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (earthRef.current) {
            earthRef.current.rotation.y = t * 0.1;
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y = t * 0.15;
            cloudsRef.current.rotation.x = Math.sin(t * 0.2) * 0.05;
        }
    });

    return (
        <Float rotationIntensity={0.5} floatIntensity={0.5} floatingRange={[0, 0.5]}>
            {/* Core Earth - Wireframe */}
            <Sphere ref={earthRef} args={[2.5, 32, 32]}>
                <meshBasicMaterial
                    color="#00ffcc"
                    wireframe
                    transparent
                    opacity={0.3}
                />
            </Sphere>

            {/* Inner Glow Sphere */}
            <Sphere args={[2.4, 32, 32]}>
                <meshBasicMaterial color="#000000" />
            </Sphere>

            {/* Cloud Layer - Points */}
            <points ref={cloudsRef}>
                <sphereGeometry args={[2.8, 64, 64]} />
                <pointsMaterial
                    size={0.02}
                    color="#bc13fe"
                    transparent
                    opacity={0.6}
                    sizeAttenuation={true}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Atmosphere Glow */}
            <mesh scale={[3, 3, 3]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial
                    color="#00ffcc"
                    transparent
                    opacity={0.05}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </Float>
    );
}

export default NeonEarth;
