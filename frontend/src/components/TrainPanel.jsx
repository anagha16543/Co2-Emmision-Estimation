import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

function TrainPanel({ apiBase, csvText, onTrainComplete, onError, hasData }) {
  const [modelType, setModelType] = useState("ridge");
  const [cv, setCv] = useState(5);
  const [isTraining, setIsTraining] = useState(false);

  const handleTrain = async () => {
    if (!csvText.trim()) {
      onError("Please upload and validate a CSV before training.");
      toast.error("Upload and validate a CSV before training.");
      return;
    }
    setIsTraining(true);
    toast("Model training started…", { icon: "⚙️" });
    try {
      const response = await axios.post(`${apiBase}/train`, {
        csv_text: csvText,
        model: modelType,
        cv: Number(cv),
      });
      onTrainComplete({
        metrics: response.data.metrics,
        params: response.data.params,
        metadata: response.data.metadata,
      });
      toast.success("Model training finished.");
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Training failed.";
      onError(message);
      toast.error(message);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <motion.section
      className="flex h-full flex-col rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl"
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <h2 className="mb-2 text-base font-semibold text-slate-100">
        2. Train Regression Model
      </h2>
      <p className="mb-3 text-xs text-slate-300">
        Choose a model type and number of cross‑validation folds. Ridge and
        Lasso automatically search for the best regularization strength (α).
      </p>

      <div className="mb-3 space-y-2 text-xs">
        <p className="font-medium text-slate-200">Model type</p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "linear", label: "Linear Regression" },
            { id: "ridge", label: "Ridge (L2)" },
            { id: "lasso", label: "Lasso (L1)" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setModelType(opt.id)}
              className={`rounded-full px-3 py-1 text-[0.75rem] font-semibold transition ${
                modelType === opt.id
                  ? "bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/40"
                  : "bg-slate-800/80 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mb-3 block text-xs text-slate-200">
        Cross‑validation folds (cv)
        <input
          type="number"
          min={2}
          max={10}
          className="mt-1 w-24 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-100 outline-none ring-emerald-500/50 focus:ring-2"
          value={cv}
          onChange={(e) => setCv(Number(e.target.value || 5))}
        />
        <span className="mt-1 block text-[0.7rem] text-slate-400">
          The dataset is split into <code>cv</code> parts; the model is trained
          and validated on different splits to estimate generalization
          performance.
        </span>
      </label>

      <div className="mt-auto">
        <button
          type="button"
          onClick={handleTrain}
          disabled={isTraining || !hasData}
          className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/60"
        >
          {isTraining ? "Training model..." : "Train model"}
        </button>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800/80">
          {isTraining ? (
            <motion.div
              className="h-full w-1/3 rounded-full bg-emerald-400"
              initial={{ x: "-100%" }}
              animate={{ x: "250%" }}
              transition={{
                repeat: Infinity,
                duration: 1.4,
                ease: "easeInOut",
              }}
            />
          ) : (
            <div className="h-full w-0" />
          )}
        </div>

        {!hasData && (
          <p className="mt-2 text-[0.7rem] text-slate-400">
            Upload and validate a CSV first to enable training.
          </p>
        )}
      </div>
    </motion.section>
  );
}

export default TrainPanel;