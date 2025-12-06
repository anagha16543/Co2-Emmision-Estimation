import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

function PredictForm({
  apiBase,
  featureNames,
  targetColumn,
  fuelTypes,
  onPrediction,
  onError,
  disabled,
}) {
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    const initial = {};
    (featureNames || []).forEach((name) => {
      if (name === targetColumn) return;
      if (name === "FuelType") {
        initial[name] = fuelTypes?.[0] || "";
      } else {
        initial[name] = "";
      }
    });
    setFormValues(initial);
  }, [featureNames, targetColumn, fuelTypes]);

  const handleChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled) return;

    const features = {};
    Object.entries(formValues).forEach(([key, value]) => {
      if (key === targetColumn) return;
      if (key === "FuelType") {
        features[key] = value;
      } else if (value === "" || value === null) {
        features[key] = null;
      } else {
        const numeric = Number(value);
        features[key] = Number.isNaN(numeric) ? value : numeric;
      }
    });

    try {
      const response = await axios.post(`${apiBase}/predict`, {
        features,
      });
      onPrediction(response.data.prediction);
      toast.success("Prediction ready.");
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Prediction failed.";
      onError(message);
      toast.error(message);
    }
  };

  const effectiveFeatures = (featureNames || []).filter(
    (name) => name !== targetColumn
  );

  return (
    <motion.section
      className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl"
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <h2 className="mb-2 text-base font-semibold text-slate-100">
        3. Predict CO₂ Emissions
      </h2>
      <p className="mb-3 text-xs text-slate-300">
        Enter engine specs to get a predicted{" "}
        <span className="font-semibold">CO₂Emissions</span> in g/km. Fields are
        inferred from your dataset&apos;s feature columns.
      </p>

      {disabled && (
        <p className="mb-3 text-[0.7rem] text-slate-400">
          Train a model first to enable predictions.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2"
      >
        {effectiveFeatures.map((name) => {
          if (name === "FuelType") {
            return (
              <label
                key={name}
                className="flex flex-col rounded-xl bg-slate-950/60 p-3"
              >
                <span className="mb-1 text-[0.7rem] font-medium text-slate-200">
                  Fuel type
                </span>
                <div className="flex gap-2">
                  {fuelTypes.map((ft) => {
                    const normalized = ft.toLowerCase();
                    const isSelected = formValues[name] === ft;
                    const icon =
                      normalized.includes("diesel")
                        ? "🚚"
                        : normalized.includes("hybrid") ||
                          normalized.includes("electric")
                        ? "🌿"
                        : "⛽";

                    return (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => handleChange(name, ft)}
                        disabled={disabled}
                        className={`flex-1 rounded-xl border px-2 py-1 text-[0.7rem] font-medium transition ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-sm"
                            : "border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-400/70 hover:bg-slate-900/80"
                        }`}
                      >
                        <span className="mr-1 text-xs" aria-hidden="true">
                          {icon}
                        </span>
                        {ft}
                      </button>
                    );
                  })}
                </div>
              </label>
            );
          }

          const label =
            name === "EngineSize"
              ? "Engine size (L)"
              : name === "Cylinders"
              ? "Cylinders"
              : name === "FuelConsumption"
              ? "Fuel consumption (L/100km)"
              : name;

          return (
            <label
              key={name}
              className="flex flex-col rounded-xl bg-slate-950/60 p-3"
            >
              <span className="mb-1 text-[0.7rem] font-medium text-slate-200">
                {label}
              </span>
              <input
                type="number"
                step="any"
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none ring-emerald-500/50 focus:ring-2"
                value={formValues[name] ?? ""}
                onChange={(e) => handleChange(name, e.target.value)}
                disabled={disabled}
              />
            </label>
          );
        })}

        <div className="col-span-full mt-1">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/60"
          >
            Predict CO₂ (g/km)
          </button>
        </div>
      </form>
    </motion.section>
  );
}

export default PredictForm;