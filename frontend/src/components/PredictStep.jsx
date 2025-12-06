import React, { useState } from "react";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import api from "../utils/api";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

function PredictStep({ apiBase, featureNames, targetColumn, fuelTypes, onPrediction, onError, onBack }) {
  const [formData, setFormData] = useState({
    EngineSize: "",
    Cylinders: "",
    FuelType: "",
    FuelConsumption: ""
  });
  const [isPredicting, setIsPredicting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePredict = async () => {
    // Validate form
    const missingFields = featureNames.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    // Validate numeric fields
    const numericFields = ['EngineSize', 'Cylinders', 'FuelConsumption'];
    for (const field of numericFields) {
      if (isNaN(formData[field]) || formData[field] === '') {
        toast.error(`${field} must be a valid number`);
        return;
      }
    }

    setIsPredicting(true);
    try {
      const features = {
        EngineSize: parseFloat(formData.EngineSize),
        Cylinders: parseInt(formData.Cylinders),
        FuelType: formData.FuelType,
        FuelConsumption: parseFloat(formData.FuelConsumption)
      };

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

  const isFormValid = featureNames.every(field => formData[field]);

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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Engine Size (L)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="8.0"
                value={formData.EngineSize}
                onChange={(e) => handleInputChange('EngineSize', e.target.value)}
                placeholder="e.g., 2.0"
                className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Number of Cylinders
              </label>
              <select
                value={formData.Cylinders}
                onChange={(e) => handleInputChange('Cylinders', e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              >
                <option value="">Select cylinders</option>
                <option value="3">3 cylinders</option>
                <option value="4">4 cylinders</option>
                <option value="6">6 cylinders</option>
                <option value="8">8 cylinders</option>
                <option value="10">10 cylinders</option>
                <option value="12">12 cylinders</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fuel Type
              </label>
              <select
                value={formData.FuelType}
                onChange={(e) => handleInputChange('FuelType', e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              >
                <option value="">Select fuel type</option>
                {fuelTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
                {!fuelTypes.length && (
                  <>
                    <option value="Gasoline">Gasoline</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fuel Consumption (L/100km)
              </label>
              <input
                type="number"
                step="0.1"
                min="3"
                max="25"
                value={formData.FuelConsumption}
                onChange={(e) => handleInputChange('FuelConsumption', e.target.value)}
                placeholder="e.g., 8.5"
                className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Preview & Info */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Input Summary</h3>

          <div className="rounded-xl bg-slate-800/30 p-4 space-y-3">
            {featureNames.map(field => (
              <div key={field} className="flex justify-between items-center">
                <span className="text-sm text-slate-400">{field}:</span>
                <span className="text-sm text-white font-medium">
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