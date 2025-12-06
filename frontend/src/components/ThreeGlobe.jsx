import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';

export default function ThreeGlobe() {
    const mesh = useRef();

    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <Sphere args={[1.5, 64, 64]} ref={mesh} position={[0, 0, 0]}>
            <MeshDistortMaterial
                color="#4f46e5"
                emissive="#06b6d4"
                emissiveIntensity={0.5}
                attach="material"
                distort={0.4}
                speed={2}
                roughness={0}
                metalness={0.8}
                wireframe
            />
        </Sphere>
    );
}
