import React from "react";
import { motion } from "framer-motion";
import CO2Visualizer from "./CO2Visualizer";
import CO2Plume from "./3d/CO2Plume";
import ReductionAdvisor from "./ReductionAdvisor";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

function ResultsStep({ prediction, metrics, params, metadata, onNewPrediction, onNewTraining }) {
  const getEmissionLevel = (value) => {
    if (value < 100) return { level: "Very Low", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    if (value < 150) return { level: "Low", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" };
    if (value < 200) return { level: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
    if (value < 250) return { level: "High", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" };
    return { level: "Very High", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
  };

  const emissionInfo = prediction ? getEmissionLevel(prediction.value) : null;

  return (
    <motion.div
      className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 backdrop-blur-md"
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Step 4: Prediction Results</h2>
          <p className="text-slate-300">
            View your CO₂ emission prediction and model performance metrics
          </p>
        </div>
        {emissionInfo && (
          <div className={`px-4 py-2 rounded-full border ${emissionInfo.border} ${emissionInfo.bg} ${emissionInfo.color} font-bold`}>
            {emissionInfo.level} Risk
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Main Prediction Result Card */}
        {prediction && (
          <div className={`relative overflow-hidden rounded-2xl p-8 text-center border ${emissionInfo.border} bg-slate-900/80 shadow-[0_0_30px_rgba(0,0,0,0.3)] group`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${emissionInfo.bg} opacity-20 group-hover:opacity-30 transition-opacity`} />

            <div className="relative z-10">
              <div className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Estimated CO₂ Emissions</div>
              <div className="text-5xl font-black text-white mb-2 tracking-tight">
                {prediction.value.toFixed(1)} <span className="text-2xl font-normal text-slate-400">g/km</span>
              </div>
              <div className={`text-lg font-semibold ${emissionInfo.color} mb-6`}>
                {emissionInfo.level} Impact Factor
              </div>

              <div className="grid grid-cols-2 gap-4 text-left bg-black/20 rounded-xl p-4 border border-white/5">
                {Object.entries(prediction.features).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-xs text-slate-500 uppercase">{key}</div>
                    <div className="text-sm text-white font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}



        {/* Visualizer */}
        <div className="h-full min-h-[350px]">
          {prediction && <CO2Plume emissionValue={prediction.value} />}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Model Performance */}
        {metrics && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Model Performance</h3>
            <div className="rounded-xl bg-slate-800/30 p-4 space-y-3 border border-white/5">
              <div className="flex justify-between items-center group">
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">RMSE (Root Mean Square Error):</span>
                <span className="text-sm text-white font-mono bg-slate-700/50 px-2 py-1 rounded">{metrics.RMSE.toFixed(3)} g/km</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">MAE (Mean Absolute Error):</span>
                <span className="text-sm text-white font-mono bg-slate-700/50 px-2 py-1 rounded">{metrics.MAE.toFixed(3)} g/km</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">R² Score (Accuracy):</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, metrics.R2 * 100))}%` }} />
                  </div>
                  <span className="text-sm text-emerald-400 font-mono font-bold">{metrics.R2.toFixed(3)}</span>
                </div>
              </div>
              {params && (
                <div className="pt-3 border-t border-slate-700/50 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Algorithm:</span>
                    <span className="text-sm text-blue-400 font-bold capitalize tracking-wide">{params.model} Regression</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feature Importance */}
        {metadata?.coefficients && metadata.coefficients.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Top Influencing Factors</h3>
            <div className="rounded-xl bg-slate-800/30 p-4 max-h-64 overflow-auto border border-white/5 custom-scrollbar">
              <div className="space-y-2">
                {metadata.coefficients.slice(0, 10).map((coef, index) => (
                  <div key={index} className="flex items-center justify-between text-sm group">
                    <span className="text-slate-300 truncate flex-1 mr-4 group-hover:text-white transition-colors" title={coef.feature}>
                      {coef.feature}
                    </span>
                    <span className={`font-mono font-medium ${coef.coefficient >= 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                      {coef.coefficient > 0 ? '↑' : '↓'} {Math.abs(coef.coefficient).toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500 italic">
                Values show how much each feature increases (red) or decreases (green) emissions.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interpretation */}
      {prediction && (
        <div className="mt-6 rounded-xl bg-slate-800/30 p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Interpretation</h4>
          <p className="text-xs text-slate-400">
            This vehicle emits approximately {prediction.value.toFixed(1)} grams of CO₂ per kilometer.
            {emissionInfo.level === "Very Low" && " This is an excellent result, typical of electric or highly efficient hybrid vehicles."}
            {emissionInfo.level === "Low" && " This indicates good fuel efficiency, common in modern compact and mid-size vehicles."}
            {emissionInfo.level === "Moderate" && " This is average for many gasoline-powered sedans and SUVs."}
            {emissionInfo.level === "High" && " This is above average, typical of larger vehicles or performance models."}
            {emissionInfo.level === "Very High" && " This indicates very high emissions, typical of heavy trucks or high-performance sports cars."}
          </p>
        </div>
      )}

      {/* Reduction Advisor */}
      {prediction && <ReductionAdvisor prediction={prediction.value} features={prediction.features} />}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={onNewTraining}
          className="flex-1 rounded-xl border border-slate-600 bg-slate-800/50 px-6 py-4 text-sm font-semibold text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all flex items-center justify-center gap-2 group"
        >
          <svg className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start New Analysis
        </button>
        <button
          onClick={onNewPrediction}
          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-sm font-bold text-white shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Analyze Another Vehicle
        </button>
      </div>
    </motion.div>
  );
}

export default ResultsStep;
