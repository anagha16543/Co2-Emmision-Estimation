import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import api from "../utils/api";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

function PredictStep({ apiBase, featureNames = [], modelFeatures = null, targetColumn, fuelTypes = [], onPrediction, onError, onBack }) {
  // Determine active features safely
  const activeFeatures = useMemo(() => {
    if (modelFeatures && Object.keys(modelFeatures).length > 0) {
      return Object.keys(modelFeatures);
    }

    // Fallback: Filter featureNames to only "Important 5" to match backend strictness
    // independent of whether model is loaded or not.
    if (!Array.isArray(featureNames)) return [];

    const priorityKeywords = ['engine', 'cylinder', 'fuel', 'class'];
    return featureNames.filter(name => {
      const lower = name.toLowerCase();
      // Exclude specific noisy columns effectively
      if (lower.includes('city') || lower.includes('hwy') || lower.includes('mpg')) return false;
      return priorityKeywords.some(kw => lower.includes(kw));
    });
  }, [modelFeatures, featureNames]);

  // Initialize form data
  const [formData, setFormData] = useState({});

  // Sync formData when features change
  useEffect(() => {
    setFormData(prev => {
      const next = { ...prev };
      activeFeatures.forEach(field => {
        if (next[field] === undefined) {
          next[field] = "";
        }
      });
      return next;
    });
  }, [activeFeatures]);


  const [isPredicting, setIsPredicting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePredict = async () => {
    // Validate form
    const missingFields = activeFeatures.filter(field => formData[field] === "" || formData[field] === null || formData[field] === undefined);

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    setIsPredicting(true);
    try {
      // Construct features object with type conversion
      const features = {};

      activeFeatures.forEach(field => {
        const value = formData[field];
        // If we have type info, coerce types
        if (modelFeatures && modelFeatures[field]?.type === "number") {
          features[field] = parseFloat(value);
        } else if (!modelFeatures) {
          // Fallback heuristic
          features[field] = isNaN(value) ? value : parseFloat(value);
        } else {
          features[field] = value;
        }
      });

      const response = await api.post("/predict", {
        features
      });

      onPrediction({
        value: response.data.prediction,
        features
      });

      toast.success("Prediction completed successfully!");
    } catch (error) {
      const message = error.response?.data?.error || "Prediction failed";
      onError(message);
      toast.error(message);
    } finally {
      setIsPredicting(false);
    }
  };

  const isFormValid = activeFeatures.every(field => formData[field] !== "" && formData[field] !== null && formData[field] !== undefined);

  return (
    <motion.div
      className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 backdrop-blur-md"
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ duration: 0.5 }}
    >
      <Toaster position="top-right" />

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Step 3: Make Prediction</h2>
        <p className="text-slate-300">
          Enter vehicle features to predict CO₂ emissions using your trained model
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Form */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Vehicle Features</h3>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {activeFeatures.map(field => {
              const featureInfo = modelFeatures?.[field];
              const isSelect = featureInfo?.type === "select";
              const isNumber = featureInfo?.type === "number";

              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {field}
                  </label>

                  {isSelect ? (
                    <select
                      value={formData[field] || ""}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                    >
                      <option value="">Select {field}</option>
                      {featureInfo.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={isNumber ? "number" : "text"}
                      step={isNumber ? "any" : undefined}
                      value={formData[field] || ""}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      placeholder={`Enter ${field}`}
                      className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview & Info */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Input Summary</h3>

          <div className="rounded-xl bg-slate-800/30 p-4 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {activeFeatures.map(field => (
              <div key={field} className="flex justify-between items-center">
                <span className="text-sm text-slate-400">{field}:</span>
                <span className="text-sm text-white font-medium text-right ml-4">
                  {formData[field] || "Not set"}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-blue-900/20 border border-blue-500/30 p-4">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">About CO₂ Emissions</h4>
            <p className="text-xs text-blue-200/80">
              CO₂ emissions are measured in grams per kilometer (g/km). Lower values indicate
              more environmentally friendly vehicles. Typical values range from 0 g/km for
              electric vehicles to 300+ g/km for high-performance sports cars.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-slate-600 bg-slate-800/50 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Training
        </button>
        <button
          onClick={handlePredict}
          disabled={isPredicting || !isFormValid}
          className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isPredicting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Predicting...
            </>
          ) : (
            <>
              Predict CO₂ Emissions
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default PredictStep;