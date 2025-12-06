import React, { useState } from "react";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import Papa from "papaparse";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

function UploadStep({ apiBase, onUploadComplete, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);

  const sampleCSV = `EngineSize,Cylinders,FuelType,FuelConsumption,CO2Emissions
2.0,4,Gasoline,8.5,196
1.8,4,Diesel,6.2,145
3.5,6,Gasoline,12.1,285
2.4,4,Hybrid,5.8,120
5.0,8,Gasoline,15.3,350
2.2,4,Diesel,7.1,165
1.6,4,Gasoline,7.2,168
3.0,6,Gasoline,10.8,245
2.0,4,Gasoline,8.9,205
1.8,4,Diesel,6.5,150`;



  // ... existing imports


  // ... existing state

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setUploadStats(null);
    toast.loading("Reading file...", { duration: 1000 });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn("CSV Parse Errors:", results.errors);
        }

        const text = Papa.unparse(results.data); // Reconstruct clean CSV if needed or just pass results
        // Actually, existing backend expects raw text string. 
        // But let's keep the raw text from FileReader for backend upload to ensure consistency,
        // or re-generate it. 
        // Wait, Papa.parse on FILE object gives results directly. 
        // to get text for backend, we might want to read it as text too OR just send the file object if backend supported it.
        // But backend expects `csv_text`. 

        // Let's read file as text for backend, AND use Papa for frontend stats/validation.
        const reader = new FileReader();
        reader.onload = (e) => {
          const rawText = e.target.result;
          setCsvText(rawText);

          // Perform frontend validation/extraction on Papa results
          processAndValidate(results.data, results.meta.fields, rawText, file.name);
        };
        reader.readAsText(file);
      },
      error: (err) => {
        toast.error("Failed to parse CSV: " + err.message);
      }
    });
  };

  const processAndValidate = async (data, fields, rawText, currentFileName) => {
    // Extract unique Fuel Types using FULL dataset
    const fuelTypes = [...new Set(data.map(row => row['FuelType'] || row['Fuel Type']).filter(Boolean))];

    setIsLoading(true);
    try {
      // Validate with backend
      const response = await axios.post(`${apiBase}/upload`, { csv_text: rawText });

      if (response.data.success) {
        const { analysis, message } = response.data;

        // Use FRONTEND counts for truth if backend is trusted, but user asked for frontend truth?
        // User said: "rows = data.length"
        const trueRows = data.length;
        const trueCols = fields;

        if (analysis.warnings?.length > 0) {
          analysis.warnings.forEach(w => toast.warning(w));
        }

        setUploadStats({ rows: trueRows, columns: trueCols.length });

        onUploadComplete({
          csvText: rawText,
          rows: trueRows,
          columns: trueCols,
          fuelTypes,
          analysis, // Backend analysis
          fileName: currentFileName,
          isSample: false // explicitly false now
        });

        toast.success(`Dataset ready! ${trueRows} rows loaded.`);
      } else {
        throw new Error(response.data.error || "Validation failed");
      }
    } catch (error) {
      const msg = error.response?.data?.error || "Validation failed";
      onError(msg);
      toast.error(msg);
      setFileName(null);
      setUploadStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update Manual Text entry to also use Papa
  const validateCSV = (text, currentFileName) => {
    const results = Papa.parse(text, { header: true, skipEmptyLines: true });
    processAndValidate(results.data, results.meta.fields, text, currentFileName);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type === "text/csv" || file.name.toLowerCase().endsWith('.csv')) {
        handleFile(file);
      } else {
        toast.error("Please upload a CSV file");
      }
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleTextareaChange = (e) => {
    setCsvText(e.target.value);
    setFileName(null);
    setUploadStats(null);
  };

  const handleValidateText = () => {
    if (!csvText || !csvText.trim()) {
      toast.error("Please enter CSV data or upload a file first");
      return;
    }
    validateCSV(csvText, "Manual Entry");
  };

  const loadSampleData = () => {
    setCsvText(sampleCSV);
    setFileName("Sample Data");
    setUploadStats(null);
    toast.success("Sample CSV loaded. Click 'Validate Dataset' to continue.");
  };

  return (
    <motion.div
      className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 backdrop-blur-md"
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ duration: 0.5 }}
    >
      <Toaster position="top-right" />

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Step 1: Upload Your Dataset</h2>
        <p className="text-slate-300">
          Upload a CSV file containing vehicle data with the required columns
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Drag & Drop Area */}
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${isDragging
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-slate-600 hover:border-slate-500"
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {fileName ? (
              <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-4">
                <div className="text-emerald-400 font-bold mb-1">Dataset Loaded</div>
                <div className="text-white text-lg font-mono mb-2 truncate">{fileName}</div>

                {uploadStats && (
                  <div className="text-emerald-300 text-xs mb-2 font-mono">
                    {uploadStats.rows} rows • {uploadStats.columns} columns
                  </div>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); setFileName(null); setCsvText(""); setUploadStats(null); }}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50">
                    <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-2">
                  Drag & drop your CSV file here
                </p>
                <p className="text-xs text-slate-500 mb-4">or</p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/50 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Choose File
                </label>
              </>
            )}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Or paste CSV data:
            </label>
            <textarea
              value={csvText}
              onChange={handleTextareaChange}
              placeholder="Paste your CSV data here or use the sample below..."
              rows="8"
              className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors font-mono text-xs"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadSampleData}
              className="flex-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-500/20 transition-colors"
            >
              Load Sample Data
            </button>
            <button
              onClick={handleValidateText}
              disabled={isLoading || !csvText.trim()}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Validating...
                </>
              ) : (
                <>
                  Validate Dataset
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-slate-800/30 p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Required CSV Format:</h3>
        <div className="text-xs text-slate-400 space-y-1 mb-3">
          <div><strong>Required Columns:</strong> EngineSize, Cylinders, FuelType, FuelConsumption, CO2Emissions</div>
          <div><strong>Data Types:</strong> All columns except FuelType should be numeric</div>
          <div><strong>Missing Values:</strong> Will be automatically handled during training</div>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-slate-300 hover:text-white font-medium">
            View Sample CSV Format
          </summary>
          <pre className="mt-2 p-3 bg-slate-900/50 rounded-lg text-slate-300 overflow-x-auto">
            {`EngineSize,Cylinders,FuelType,FuelConsumption,CO2Emissions
2.0,4,Gasoline,8.5,196
1.8,4,Diesel,6.2,145
3.5,6,Gasoline,12.1,285
2.4,4,Hybrid,5.8,120
5.0,8,Gasoline,15.3,350`}</pre>
        </details>
      </div>

      <div className="mt-4 rounded-xl bg-yellow-900/20 border border-yellow-500/30 p-4">
        <h4 className="text-sm font-semibold text-yellow-300 mb-2">Troubleshooting Tips:</h4>
        <ul className="text-xs text-yellow-200/80 space-y-1">
          <li>• Ensure your CSV has the exact column names (case-sensitive)</li>
          <li>• Check that numeric columns don't contain text or special characters</li>
          <li>• Remove any extra spaces around commas in your CSV</li>
          <li>• Use the sample data above as a reference format</li>
        </ul>
      </div>
    </motion.div>
  );
}

export default UploadStep;