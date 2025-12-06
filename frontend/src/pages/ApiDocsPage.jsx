import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ApiDocsPage() {
    const { token } = useAuth();

    const endpoints = [
        {
            method: 'POST',
            path: '/predict',
            description: 'Get CO₂ emission prediction for vehicle features.',
            body: {
                features: {
                    EngineSize: 2.0,
                    Cylinders: 4,
                    FuelType: "Gasoline",
                    FuelConsumption: 8.5
                }
            }
        },
        {
            method: 'POST',
            path: '/train',
            description: 'Train a new model using CSV data.',
            body: {
                csv_text: "EngineSize,Cylinders...\\n2.0,4...",
                model: "ridge",
                cv: 5
            }
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.1),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.1),transparent_55%)] mix-blend-screen blur-3xl" />

            <div className="max-w-4xl mx-auto relative z-10">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 mb-2">API Documentation</h1>
                        <p className="text-slate-400">Integrate Carbon.AI directly into your applications.</p>
                    </div>
                    <Link to="/dashboard" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm">
                        Back to Dashboard
                    </Link>
                </header>

                <div className="space-y-12">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold mb-4">Authentication</h2>
                        <p className="text-sm text-slate-400 mb-4">Include your access token in the header of every request.</p>
                        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-emerald-500/20 text-emerald-400 shadow-inner">
                            Authorization: Bearer {token || '<YOUR_ACCESS_TOKEN>'}
                        </div>
                    </div>

                    {endpoints.map((ep, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <span className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">{ep.method}</span>
                                <span className="font-mono text-slate-200">{ep.path}</span>
                            </div>
                            <p className="text-slate-400 mb-6">{ep.description}</p>

                            <h3 className="text-sm font-semibold mb-2 text-slate-500 uppercase tracking-wider">Example Request (cURL)</h3>
                            <div className="bg-black/40 rounded-lg p-4 font-mono text-xs overflow-x-auto text-slate-300 border border-white/5 shadow-inner">
                                <pre>{`curl -X ${ep.method} http://localhost:5000${ep.path} \\
  -H "Authorization: Bearer ${token ? '$TOKEN' : '<YOUR_TOKEN>'}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(ep.body, null, 2)}'`}</pre>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
