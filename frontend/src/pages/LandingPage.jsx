import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AntigravityParticles from '../components/3d/AntigravityParticles';
import NeonEarth from '../components/3d/NeonEarth';
import HologramCard from '../components/LandingUI/HologramCard';
import { useAuth } from '../context/AuthContext';

function LandingPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showUI, setShowUI] = useState(true);
    const [isAntigravityMode, setIsAntigravityMode] = useState(true);

    const toggleMode = () => setIsAntigravityMode(!isAntigravityMode);

    const handleNavigate = (path) => {
        navigate(path);
    };

    const menuItems = [
        {
            title: "Analyze & Train",
            path: "/workspace",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            title: "My Profile",
            path: "/workspace", // Placeholder
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        }
    ];

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden select-none">

            {/* 3D Scene Background */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
                    <color attach="background" args={['#050505']} />
                    <fog attach="fog" args={['#050505', 5, 20]} />

                    <Suspense fallback={null}>
                        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1} color="#00ffcc" />
                        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#bc13fe" />

                        <AntigravityParticles isAntigravityMode={isAntigravityMode} />
                        <NeonEarth />

                        <OrbitControls
                            enableZoom={false}
                            enablePan={false}
                            autoRotate
                            autoRotateSpeed={0.5}
                            maxPolarAngle={Math.PI / 1.5}
                            minPolarAngle={Math.PI / 3}
                        />
                    </Suspense>
                </Canvas>
            </div>

            {/* Foreground UI Overlay */}
            <AnimatePresence>
                {showUI && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 pointer-events-none">

                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-auto"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 blur-sm absolute" />
                                <h1 className="text-3xl font-black text-white relative z-10 tracking-tighter">
                                    CO2 <span className="text-emerald-400">PREDECTO</span>
                                </h1>
                            </div>

                            <div className="text-right">
                                <p className="text-slate-400 text-sm">Welcome back,</p>
                                <p className="text-white font-bold text-lg">{user?.username || 'Researcher'}</p>
                            </div>
                        </motion.div>

                        {/* Central Hologram Menu - SINGLE BUTTON */}
                        <div className="flex justify-center pointer-events-auto mt-20">
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(52, 211, 153, 0.4)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleNavigate('/workspace')}
                                className="group relative px-12 py-6 bg-black/40 border border-emerald-500/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="relative z-10 flex flex-col items-center gap-3">
                                    <div className="p-3 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <span className="text-2xl font-black text-white tracking-wide uppercase">Start Predicting</span>
                                    <span className="text-sm text-emerald-300/80 font-mono tracking-wider">Analyze Vehicle Emissions</span>
                                </div>
                            </motion.button>
                        </div>

                        {/* Footer / System Status - REMOVED */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="absolute bottom-8 text-center flex flex-col items-center gap-4"
                        >
                            {/* UI Elements removed as per request */}
                        </motion.div>

                        {/* Logout Button (Bottom Right) */}
                        <motion.button
                            onClick={logout}
                            whileHover={{ scale: 1.05 }}
                            className="absolute bottom-8 right-8 pointer-events-auto flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <span className="text-sm font-semibold">DISCONNECT</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </motion.button>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default LandingPage;
