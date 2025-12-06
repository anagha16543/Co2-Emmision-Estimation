import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';
import ThreeGlobe from '../components/ThreeGlobe';

export default function LoginPage() {
    const { login, signup } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isLogin) {
                await login(username, password);
            } else {
                await signup(username, password);
                await login(username, password);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black text-white">
            {/* Background Particles */}
            <ParticleBackground />

            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center lg:flex-row">

                {/* Left Side: Form */}
                <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,255,136,0.1)]"
                    >
                        <h1 className="mb-2 text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                            CO2 PREDECTO
                        </h1>
                        <p className="mb-8 text-slate-400">Next-Gen CO₂ Emission Prediction</p>

                        {error && (
                            <div className="mb-4 rounded bg-red-500/20 p-3 text-red-200 text-sm border border-red-500/50">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Username</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
                                <input
                                    type="password"
                                    className="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 p-3 font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-cyan-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="relative z-10">
                                    {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                                </div>
                                {!isLoading && <div className="absolute inset-0 z-0 bg-gradient-to-r from-cyan-600 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100" />}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-400">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: 3D Globe */}
                <div className="hidden h-full w-full items-center justify-center lg:flex lg:w-1/2">
                    <div className="h-[600px] w-[600px]">
                        <Canvas camera={{ position: [0, 0, 3] }}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1} color="#00ffcc" />
                            <ThreeGlobe />
                        </Canvas>
                    </div>
                </div>
            </div>
        </div>
    );
}
