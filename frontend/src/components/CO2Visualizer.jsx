import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Stars } from '@react-three/drei';
import * as THREE from 'three';

function Cloud({ count, color }) {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Create stable particles
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 500; i++) { // Max pool size
            const t = Math.random() * 100;
            const factor = 1.3 + Math.random() * 0.5; // Distance from center
            const speed = 0.005 + Math.random() / 100;
            const x = (Math.random() - 0.5) * 2;
            const y = (Math.random() - 0.5) * 2;
            const z = (Math.random() - 0.5) * 2;

            // Normalize vector
            const mag = Math.sqrt(x * x + y * y + z * z);
            temp.push({ t, factor, speed, x: x / mag, y: y / mag, z: z / mag });
        }
        return temp;
    }, []);

    useFrame((state) => {
        if (!mesh.current) return;

        // Update only 'count' number of particles
        for (let i = 0; i < count; i++) {
            const particle = particles[i];
            let { t, factor, speed, x, y, z } = particle;

            // Animate t
            particle.t += speed;
            const time = particle.t;

            dummy.position.set(
                x * factor + Math.sin(time) * 0.1,
                y * factor + Math.cos(time * 0.8) * 0.1,
                z * factor + Math.sin(time * 1.2) * 0.1
            );

            const s = 0.08;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        }

        // Hide unused particles
        for (let i = count; i < 500; i++) {
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        }

        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, 500]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
        </instancedMesh>
    );
}

export default function CO2Visualizer({ emissionValue }) {
    // Normalizing emission: 0 (low) to 400 (high)
    const val = emissionValue || 0;
    const normalized = Math.min(Math.max(val, 0), 400);
    const intensity = normalized / 400; // 0 to 1

    // Interpolate color from Green to Red
    // HSL: Green=0.33, Red=0.0
    const hue = 0.33 * (1 - intensity);
    const color = new THREE.Color().setHSL(hue, 1, 0.5);

    // Count: 20 to 500
    const count = 20 + Math.floor(intensity * 480);

    return (
        <div className="h-[300px] w-full rounded-2xl bg-black/40 overflow-hidden border border-white/10 relative shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <Canvas camera={{ position: [0, 0, 4.5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

                {/* Earth Core */}
                <Sphere args={[1.2, 32, 32]}>
                    <MeshDistortMaterial
                        color="#2563eb"
                        emissive="#1d4ed8"
                        emissiveIntensity={0.2}
                        attach="material"
                        distort={0.2}
                        speed={2}
                        wireframe={true}
                    />
                </Sphere>

                {/* Inner Glow Sphere (Solid) */}
                <Sphere args={[1.1, 32, 32]}>
                    <meshBasicMaterial color="#000" transparent opacity={0.9} />
                </Sphere>

                {/* CO2 Cloud */}
                <Cloud count={count} color={color} />
            </Canvas>
            <div className="absolute top-4 left-4 rounded-lg bg-black/60 backdrop-blur-md px-3 py-1 border border-white/10">
                <div className="text-xs text-slate-400">Visualizing Density</div>
            </div>
        </div>
    );
}
