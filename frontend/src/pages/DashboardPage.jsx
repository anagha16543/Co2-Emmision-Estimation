import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

import UploadStep from "../components/UploadStep.jsx";
import TrainStep from "../components/TrainStep.jsx";
import PredictStep from "../components/PredictStep.jsx";
import ResultsStep from "../components/ResultsStep.jsx";

const API_BASE = "http://localhost:5000";

const fadeInUp = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
    const { logout, user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [csvText, setCsvText] = useState("");
    const [columns, setColumns] = useState([]);
    const [fuelTypes, setFuelTypes] = useState([]);
    const [uploadInfo, setUploadInfo] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [params, setParams] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [globalError, setGlobalError] = useState("");

    const handleUploadComplete = ({ csvText, rows, columns, fuelTypes }) => {
        setCsvText(csvText);
        setColumns(columns);
        setFuelTypes(fuelTypes);
        setUploadInfo({ rows, columns });
        setMetrics(null);
        setParams(null);
        setMetadata(null);
        setPrediction(null);
        setGlobalError("");
        setCurrentStep(2);
    };

    const handleTrainComplete = ({ metrics, params, metadata }) => {
        setMetrics(metrics);
        setParams(params);
        setMetadata(metadata);
        setGlobalError("");
        setCurrentStep(3);
    };

    const handlePrediction = (value) => {
        setPrediction(value);
        setGlobalError("");
        setCurrentStep(4);
    };

    const handleError = (message) => {
        setGlobalError(message || "Something went wrong. Please try again.");
    };

    const steps = [
        { number: 1, title: "Upload Data", description: "Upload and validate your dataset" },
        { number: 2, title: "Train Model", description: "Select and train machine learning model" },
        { number: 3, title: "Make Prediction", description: "Input features to predict CO₂ emissions" },
        { number: 4, title: "View Results", description: "See prediction results and analysis" },
    ];

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <UploadStep
                        apiBase={API_BASE}
                        onUploadComplete={handleUploadComplete}
                        onError={handleError}
                    />
                );
            case 2:
                return (
                    <TrainStep
                        apiBase={API_BASE}
                        csvText={csvText}
                        uploadInfo={uploadInfo}
                        onTrainComplete={handleTrainComplete}
                        onError={handleError}
                        onBack={() => setCurrentStep(1)}
                    />
                );
            case 3:
                return (
                    <PredictStep
                        apiBase={API_BASE}
                        featureNames={metadata?.feature_names_original || columns.filter(c => c !== "CO2Emissions")}
                        targetColumn={metadata?.target_column || "CO2Emissions"}
                        fuelTypes={fuelTypes}
                        onPrediction={handlePrediction}
                        onError={handleError}
                        onBack={() => setCurrentStep(2)}
                    />
                );
            case 4:
                return (
                    <ResultsStep
                        prediction={prediction}
                        metrics={metrics}
                        params={params}
                        metadata={metadata}
                        onNewPrediction={() => setCurrentStep(3)}
                        onNewTraining={() => setCurrentStep(1)}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
            {/* Static background */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.2),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.22),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(236,72,153,0.14),transparent_55%)] mix-blend-screen blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-4 py-8">
                {/* Navigation Bar */}
                <nav className="mb-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors group">
                            <svg className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="hidden sm:inline font-medium">Hub</span>
                        </Link>
                        <div className="text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                            CO2 PREDECTO <span className="text-xs font-mono text-slate-500 ml-2 border border-slate-700 rounded px-1">WORKSPACE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-slate-400 text-sm hidden sm:inline">Welcome, {user?.username}</span>
                        <button
                            onClick={logout}
                            className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </nav>

                {/* Header */}
                <motion.header
                    className="mb-8 text-center"
                    initial={fadeInUp.initial}
                    animate={fadeInUp.animate}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                        CO₂ Emission Prediction Studio
                    </h1>
                    <p className="mt-3 text-sm text-slate-300 sm:text-base">
                        Professional Grade AI Modeling
                    </p>
                </motion.header>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between px-4 sm:px-12">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center w-full">
                                <div className="flex flex-col items-center relative z-10">
                                    <div
                                        className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 ${currentStep >= step.number
                                            ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                            : "border-slate-600 bg-slate-900 text-slate-400"
                                            }`}
                                    >
                                        {step.number}
                                    </div>
                                    <div className="absolute top-14 w-32 text-center hidden sm:block">
                                        <div className={`text-xs font-medium transition-colors ${currentStep >= step.number ? "text-emerald-400" : "text-slate-500"
                                            }`}>
                                            {step.title}
                                        </div>
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="flex-1 mx-2 h-0.5 relative">
                                        <div className="absolute inset-0 bg-slate-800"></div>
                                        <motion.div
                                            initial={{ width: "0%" }}
                                            animate={{ width: currentStep > step.number ? "100%" : "0%" }}
                                            className="absolute inset-0 bg-emerald-500 transition-all duration-500"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {globalError && (
                    <motion.div
                        className="mb-6 rounded-2xl border border-red-500/40 bg-red-900/40 px-4 py-3 text-sm text-red-100 backdrop-blur-md"
                        initial={fadeInUp.initial}
                        animate={fadeInUp.animate}
                    >
                        {globalError}
                    </motion.div>
                )}

                {/* Current Step Content */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[400px] rounded-3xl border border-white/5 bg-slate-900/50 p-6 backdrop-blur-sm"
                >
                    {renderStep()}
                </motion.div>

                {/* Footer */}
                <footer className="mt-12 text-center text-xs text-slate-500 border-t border-white/5 pt-8">
                    <p>Windsurf Agentic AI • CO₂ Prediction Suite</p>
                </footer>
            </div>
        </div>
    );
}
