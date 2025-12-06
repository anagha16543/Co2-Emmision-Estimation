import React, { useState } from "react";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import api from "../utils/api";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

function TrainStep({ apiBase, csvText, uploadInfo, onTrainComplete, onError, onBack }) {
  const [selectedModel, setSelectedModel] = useState("ridge");
  const [isTraining, setIsTraining] = useState(false);
  const [cvFolds, setCvFolds] = useState(5);

  const handleTrain = async () => {
    if (!csvText) {
      toast.error("No dataset available to train. Please upload data first.");
      return;
    }

    setIsTraining(true);
    try {
      const response = await api.post("/train", {
        csv_text: csvText,
        model: selectedModel,
        cv: cvFolds,
      });

      const { metrics, params, metadata } = response.data;
      onTrainComplete({ metrics, params, metadata });

      toast.success(`Model trained successfully! RMSE: ${metrics.RMSE.toFixed(2)}`);
    } catch (error) {
      const message = error.response?.data?.error || error.message || "Training failed. Please check your dataset format.";
      onError(message);
      toast.error(message);
    } finally {
      setIsTraining(false);
    }
  };

  const models = [
    {
      id: "linear",
      name: "Linear Regression",
      description: "Simple linear model without regularization",
      bestFor: "Simple datasets with clear linear relationships"
    },
    {
      id: "ridge",
      name: "Ridge Regression",
      description: "Linear model with L2 regularization",
      bestFor: "Datasets with multicollinearity issues"
    },
    {
      id: "lasso",
      name: "Lasso Regression",
      description: "Linear model with L1 regularization and feature selection",
      bestFor: "Datasets where feature selection is important"
    }
  ];

  return (
    <motion.div
      className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 backdrop-blur-md"
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ duration: 0.5 }}
    >
      <Toaster position="top-right" />

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Step 2: Train Your Model</h2>
        <p className="text-slate-300">
          Select a machine learning model and train it on your uploaded dataset
        </p>
      </div>

      {/* Dataset Info */}
      {uploadInfo && (
        <div className="mb-6 rounded-xl bg-slate-800/30 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Dataset Summary:</h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Rows:</span>
              <span className="ml-2 text-white">{uploadInfo.rows}</span>
            </div>
            <div>
              <span className="text-slate-400">Columns:</span>
              <span className="ml-2 text-white">{uploadInfo.columns.length}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">Features:</span>
              <span className="ml-2 text-white">
                {uploadInfo.columns.filter(c => c !== "CO2Emissions").join(", ")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select Model Type</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {models.map((model) => (
            <div
              key={model.id}
              className={`rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 ${selectedModel === model.id
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-slate-600 bg-slate-800/30 hover:border-slate-500"
                }`}
              onClick={() => setSelectedModel(model.id)}
            >
              <div className="flex items-center mb-2">
                <div className={`h-4 w-4 rounded-full border-2 mr-3 ${selectedModel === model.id
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-slate-500"
                  }`} />
                <h4 className="font-semibold text-white">{model.name}</h4>
              </div>
              <p className="text-xs text-slate-300 mb-2">{model.description}</p>
              <p className="text-xs text-slate-500">
                <strong>Best for:</strong> {model.bestFor}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Training Configuration */}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-slate-600 bg-slate-800/50 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Upload
        </button>
        <button
          onClick={handleTrain}
          disabled={isTraining || !csvText}
          className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isTraining ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Training Model...
            </>
          ) : (
            <>
              Train Model
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default TrainStep;