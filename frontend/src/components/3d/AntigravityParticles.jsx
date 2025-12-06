import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const particleCount = 4000;
const mouseInfluenceRadius = 4;
const gravityStrength = 0.3; // Reduced speed slightly (from 0.8)
const friction = 0.92;
const homeForce = 0.02; // Spring force to return to origin ("Spread Again")

function AntigravityParticles({ isAntigravityMode = true }) {
    const meshRef = useRef();
    const { viewport, mouse } = useThree();
    const [clicked, setClicked] = useState(false);

    // Pre-allocate reusable objects to avoid GC churn per frame
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const cyanColor = useMemo(() => new THREE.Color('#00ffff'), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    // Initialize particle data
    const particles = useMemo(() => {
        const temp = [];
        // Realistic Tech Palette: White, Ice Blue, Carbon
        const colorPalette = [
            new THREE.Color('#ffffff'), // Pure White
            new THREE.Color('#e0f7fa'), // Ice Blue
            new THREE.Color('#b0bec5'), // Blue Grey (Carbon)
            new THREE.Color('#81d4fa')  // Light Sky Blue
        ];

        // Spread across entire screen (wide field)
        const width = 80;
        const height = 50;

        for (let i = 0; i < particleCount; i++) {
            const x = (Math.random() - 0.5) * width;
            const y = (Math.random() - 0.5) * height;
            const z = (Math.random() - 0.5) * 30;

            temp.push({
                x, y, z,
                ox: x, oy: y, oz: z, // Original Home Position
                vx: (Math.random() - 0.5) * 0.01, // Gentler drift
                vy: (Math.random() - 0.5) * 0.01,
                vz: (Math.random() - 0.5) * 0.01,
                color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
                scale: Math.random() * 0.08 + 0.02 // Small scale
            });
        }
        return temp;
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;

        // Convert normalized mouse coordinates (-1 to 1) to world coordinates
        const mouseX = (mouse.x * viewport.width) / 2;
        const mouseY = (mouse.y * viewport.height) / 2;

        // Animate each particle
        particles.forEach((p, i) => {
            // Calculate distance to mouse
            const dx = mouseX - p.x;
            const dy = mouseY - p.y;
            const dz = 0 - p.z; // Mouse is at z=0 plane
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;

            // --- PHYSICS LOGIC ---

            // 1. COLLAPSE (Attraction to active cursor)
            // "When cursor points" -> Proximity trigger (Wide range)
            let isAttracted = dist < mouseInfluenceRadius * 6;

            if (isAttracted) {
                // Collapse towards mouse
                const force = gravityStrength * 1.5 / (dist * 0.5 + 0.1);
                p.vx += dx * force * 0.02;
                p.vy += dy * force * 0.02;
                p.vz += dz * force * 0.02;
            } else {
                // 2. SPREAD AGAIN (Return to Origin / Home Position)
                // Spring force pulling back to ox, oy, oz
                const hx = p.ox - p.x;
                const hy = p.oy - p.y;
                const hz = p.oz - p.z;

                p.vx += hx * homeForce;
                p.vy += hy * homeForce;
                p.vz += hz * homeForce;
            }

            // 3. Idle Noise (Drift)
            p.vx += (Math.random() - 0.5) * 0.01;
            p.vy += (Math.random() - 0.5) * 0.01;
            p.vz += (Math.random() - 0.5) * 0.01;

            // 4. Friction/Damping
            p.vx *= friction;
            p.vy *= friction;
            p.vz *= friction;

            // 5. Update Position
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            // Update Matrix
            dummy.position.set(p.x, p.y, p.z);
            dummy.scale.set(p.scale, p.scale, p.scale);
            dummy.updateMatrix();

            meshRef.current.setMatrixAt(i, dummy.matrix);

            // Dynamic coloration based on speed
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > 0.2) {
                // Reuse pre-allocated cyan color object
                meshRef.current.setColorAt(i, cyanColor);
            } else {
                meshRef.current.setColorAt(i, p.color);
            }
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, particleCount]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    );
}

export default AntigravityParticles;
