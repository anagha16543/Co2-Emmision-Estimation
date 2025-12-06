import React from "react";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

function MetricsCard({ title, value, tooltip }) {
  const formatted =
    typeof value === "number" && Number.isFinite(value)
      ? value.toFixed(3)
      : "N/A";

  return (
    <motion.div
      className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 text-xs text-slate-100 shadow-lg backdrop-blur-xl"
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ duration: 0.4 }}
      title={tooltip}
    >
      <p className="mb-1 text-[0.7rem] uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="text-lg font-semibold text-emerald-300">{formatted}</p>
      <p className="mt-1 text-[0.65rem] text-slate-400">
        Hover to read what this metric means.
      </p>
    </motion.div>
  );
}

export default MetricsCard;