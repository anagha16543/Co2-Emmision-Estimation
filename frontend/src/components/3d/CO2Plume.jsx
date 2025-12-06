import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SmokeShader = {
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uDensity;
    varying vec2 vUv;

    // Simple Noise Function
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 st) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
        for (int i = 0; i < 5; ++i) {
            v += a * noise(st);
            st = rot * st * 2.0 + shift;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        vec2 uv = vUv;
        
        // Upward movement
        vec2 q = vec2(0.);
        q.x = fbm( uv + 0.1*uTime);
        q.y = fbm( uv + vec2(1.0));

        vec2 r = vec2(0.);
        r.x = fbm( uv + 1.0*q + vec2(1.7,9.2)+ 0.15*uTime );
        r.y = fbm( uv + 1.0*q + vec2(8.3,2.8)+ 0.126*uTime);

        float f = fbm(uv+r);

        // Density gradient (fade out at top and sides)
        float alpha = f * uDensity;
        float centerFade = 1.0 - distance(uv.x, 0.5) * 2.0;
        float bottomFade = uv.y; // dense at bottom? no, maybe consistent
        
        // Circular mask for plume shape
        float dist = distance(uv, vec2(0.5, 0.0)); // Top origin?? No, smoke rises.
        // Let's assume plane is 0,0 at center.
        // Actually UV is 0-1. 0,0 bottom left.
        
        // Plume Shape: Wider at top
        float shape = smoothstep(0.8, 0.2, abs(uv.x - 0.5) - uv.y * 0.3);
        
        // Combine
        float opacity = alpha * shape * uDensity * 2.0;
        opacity *= smoothstep(0.0, 0.2, uv.y); // Fade in at bottom
        opacity *= smoothstep(1.0, 0.8, uv.y); // Fade out at top

        vec3 colorFinal = mix(vec3(0.1), uColor, f); // Mix dark smoke with glowing color

        gl_FragColor = vec4(colorFinal, opacity);
    }
  `
};

function Plume({ emissionValue }) {
    const mesh = useRef();

    // Map emission to Color & Density
    const { color, density } = useMemo(() => {
        let c = new THREE.Color('#34d399'); // Green default
        let d = 1.0;

        if (emissionValue < 100) {
            c.set('#34d399'); // Emerald/Green
            d = 0.8;
        } else if (emissionValue < 180) {
            c.set('#facc15'); // Yellow
            d = 1.2;
        } else if (emissionValue < 250) {
            c.set('#fb923c'); // Orange
            d = 1.5;
        } else {
            c.set('#f87171'); // Red
            d = 2.0;
        }

        return { color: c, density: d };
    }, [emissionValue]);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uDensity: { value: density }
    }), [color, density]);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <mesh ref={mesh} position={[0, 0, 0]} scale={[4, 5, 1]}>
            <planeGeometry args={[1, 1, 32, 32]} />
            <shaderMaterial
                vertexShader={SmokeShader.vertexShader}
                fragmentShader={SmokeShader.fragmentShader}
                uniforms={uniforms}
                transparent={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
}

export default function CO2Plume({ emissionValue }) {
    return (
        <div className="w-full h-full min-h-[300px] bg-slate-900/50 rounded-xl overflow-hidden relative border border-slate-700/50">
            <div className="absolute top-4 left-4 z-10">
                <h4 className="text-sm font-semibold text-slate-300">Emission Visualization</h4>
                <p className="text-xs text-slate-500">Volumetric Plume Density</p>
            </div>
            <Canvas camera={{ position: [0, 0, 3] }}>
                <ambientLight intensity={0.5} />
                <Plume emissionValue={emissionValue} />
            </Canvas>
        </div>
    );
}
