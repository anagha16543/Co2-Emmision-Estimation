import React from 'react';
import { motion } from 'framer-motion';

export default function ReductionAdvisor({ prediction, features }) {
    // Simple logic for advice based on inputs
    const advice = [];

    // Fuel Type advice
    const fuel = features.FuelType || features['Fuel Type'];
    if (['Gasoline', 'Diesel', 'Z', 'X', 'D'].includes(fuel)) {
        advice.push({
            title: 'Switch to Hybrid Vehicle',
            desc: 'Hybrid technology captures braking energy',
            reduction: '30%',
            impact: 'High'
        });
        advice.push({
            title: 'Transition to Electric (EV)',
            desc: 'Zero tailpipe emissions',
            reduction: '100%',
            impact: 'Max'
        });
    }

    // Cylinders advice
    const cylinders = parseInt(features.Cylinders);
    if (cylinders > 4) {
        advice.push({
            title: `Downsize to 4 Cylinders`,
            desc: 'Modern turbo-4s offer similar power',
            reduction: '15-25%',
            impact: 'Medium'
        });
    }

    // Engine Size advice
    const engine = parseFloat(features.EngineSize);
    if (engine > 2.0) {
        advice.push({
            title: 'Optimize Engine Size',
            desc: 'Smaller engines consume less fuel at idle',
            reduction: `${Math.round((engine - 2.0) * 10)}%`,
            impact: 'Medium'
        });
    }

    // Fuel Consumption advice
    const consumption = parseFloat(features.FuelConsumption);
    if (consumption > 8) {
        advice.push({
            title: 'Improve Aerodynamics',
            desc: 'Reduce drag with smoother driving',
            reduction: '5-10%',
            impact: 'Low'
        });
    }

    // Fallback
    if (advice.length === 0) {
        advice.push({
            title: 'Eco-Driving Habits',
            desc: 'Avoid rapid acceleration and braking',
            reduction: '10%',
            impact: 'Low'
        });
    }

    return (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 p-6 backdrop-blur-md">
            <h3 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Reduction Advisor
                <span className="text-xs font-normal text-emerald-600 bg-emerald-900/40 px-2 py-1 rounded-full border border-emerald-500/20 ml-2">Beta</span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
                {advice.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-black/20 p-4 hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-emerald-100 group-hover:text-white transition-colors">{item.title}</span>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 text-nowrap ml-2">-{item.reduction} CO₂</span>
                        </div>
                        <p className="text-xs text-slate-400">{item.desc}</p>

                        {/* Glow effect */}
                        <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
