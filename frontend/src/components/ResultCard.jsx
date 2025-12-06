import React from "react";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

function ResultCard({ prediction }) {
  return (
    <motion.section
      className="flex h-full flex-col justify-between rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 text-xs text-slate-100 shadow-xl backdrop-blur-xl"
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div>
        <h2 className="mb-2 text-base font-semibold text-slate-100">
          Prediction Result
        </h2>
        <p className="mb-4 text-xs text-slate-300">
          After you submit engine specs, the trained model predicts the expected{" "}
          <span className="font-semibold">CO₂Emissions</span> in grams per
          kilometer (g/km).
        </p>
      </div>

      <motion.div
        className="mt-auto rounded-2xl bg-gradient-to-br from-emerald-500/25 via-emerald-400/15 to-sky-500/25 p-4 text-center shadow-inner"
        animate={{
          boxShadow:
            typeof prediction === "number"
              ? [
                  "0 0 0 0 rgba(16,185,129,0.4)",
                  "0 0 0 16px rgba(16,185,129,0)",
                ]
              : "0 0 0 0 rgba(15,23,42,0.9)",
        }}
        transition={{
          duration: typeof prediction === "number" ? 1.6 : 0.4,
          repeat: typeof prediction === "number" ? Infinity : 0,
          repeatType: "loop",
        }}
      >
        {typeof prediction === "number" ? (
          <>
            <p className="text-[0.7rem] uppercase tracking-wide text-emerald-200">
              Predicted CO₂ emissions
            </p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-300">
              {prediction.toFixed(1)}{" "}
              <span className="text-sm font-semibold text-emerald-100">
                g/km
              </span>
            </p>
          </>
        ) : (
          <p className="text-[0.75rem] text-slate-300">
            No prediction yet. Train a model and submit a feature set to see the
            estimated CO₂ emissions.
          </p>
        )}
      </motion.div>
    </motion.section>
  );
}

export default ResultCard;