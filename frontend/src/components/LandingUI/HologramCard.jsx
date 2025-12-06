import React from 'react';
import { motion } from 'framer-motion';

function HologramCard({ title, icon, onClick, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{
                delay,
                type: "spring",
                stiffness: 100,
                damping: 20
            }}
            whileHover={{
                scale: 1.05,
                translateY: -10,
                boxShadow: "0 0 30px rgba(0, 255, 204, 0.3)",
                borderColor: "rgba(0, 255, 204, 0.8)"
            }}
            onClick={onClick}
            className="
        relative group cursor-pointer 
        w-64 h-48 bg-slate-900/40 backdrop-blur-xl 
        border border-white/10 rounded-2xl 
        flex flex-col items-center justify-center 
        overflow-hidden transition-colors duration-300
        hover:bg-slate-800/60
      "
            style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px'
            }}
        >
            {/* Holographic Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />

            {/* Icon */}
            <div className="mb-4 p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300 text-emerald-400">
                {icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                {title}
            </h3>

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500/0 group-hover:border-emerald-500/100 transition-all duration-300" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500/0 group-hover:border-emerald-500/100 transition-all duration-300" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500/0 group-hover:border-emerald-500/100 transition-all duration-300" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500/0 group-hover:border-emerald-500/100 transition-all duration-300" />

        </motion.div>
    );
}

export default HologramCard;
