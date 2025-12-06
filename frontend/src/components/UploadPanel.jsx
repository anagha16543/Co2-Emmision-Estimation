import React, { useCallback, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

function parsePreview(csvText, maxRows = 10) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { header: [], rows: [] };

  const header = lines[0].split(",");
  const rows = lines.slice(1, maxRows + 1).map((line) => line.split(","));
  return { header, rows };
}

function extractFuelTypes(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  const header = lines[0].split(",");
  const fuelIndex = header.indexOf("FuelType");
  if (fuelIndex === -1) return [];

  const values = new Set();
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",");
    if (cols[fuelIndex]) {
      values.add(cols[fuelIndex].trim());
    }
  }
  return Array.from(values);
}

function UploadPanel({ apiBase, onUploadComplete, onError }) {
  const [localCsvText, setLocalCsvText] = useState("");
  const [preview, setPreview] = useState({ header: [], rows: [] });
  const [rowsInfo, setRowsInfo] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setLocalCsvText(text);
      setPreview(parsePreview(text));
      setHasFile(true);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleValidate = async () => {
    if (!localCsvText.trim()) {
      onError("Please load a CSV file or paste CSV text before validating.");
      toast.error("Load a CSV file or paste data before validating.");
      return;
    }
    setIsValidating(true);
    setProgress(15);
    try {
      const response = await axios.post(`${apiBase}/upload`, {
        csv_text: localCsvText,
      });
      const { rows, columns } = response.data;
      const fuels = extractFuelTypes(localCsvText);
      setRowsInfo({ rows, columns });
      setPreview(parsePreview(localCsvText));
      setProgress(85);

      onUploadComplete({
        csvText: localCsvText,
        rows,
        columns,
        fuelTypes: fuels,
      });
      toast.success("Dataset validated and ready for training.");
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Upload failed.";
      onError(message);
      toast.error(message);
    } finally {
      setIsValidating(false);
      setProgress(0);
    }
  };

  return (
    <motion.section
      className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl"
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ duration: 0.4 }}
    >
      <h2 className="mb-2 text-base font-semibold text-slate-100">
        1. Upload & Validate CSV
      </h2>
      <p className="mb-3 text-xs text-slate-300">
        Use the sample structure from the README. Required columns:{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5 text-[0.7rem]">
          EngineSize, Cylinders, FuelType, FuelConsumption, CO2Emissions
        </code>
        .
      </p>

      <motion.div
        className={`mb-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-600/80 bg-slate-950/80 px-4 py-6 text-center text-xs text-slate-300 shadow-inner transition-all ${
          dragOver
            ? "border-emerald-400/80 bg-slate-950/95 shadow-emerald-500/20"
            : "hover:border-emerald-400/60 hover:bg-slate-900/80"
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <motion.div
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/40 via-sky-400/40 to-violet-400/40 text-emerald-50 shadow-lg shadow-emerald-500/30"
          animate={{ y: dragOver ? -2 : 0, boxShadow: dragOver ? "0 20px 45px rgba(16,185,129,0.4)" : "0 18px 40px rgba(15,23,42,0.9)" }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <span className="text-lg font-bold">CSV</span>
        </motion.div>
        <p className="mb-1 text-[0.7rem] uppercase tracking-wide text-emerald-300">
          Drag &amp; drop dataset
        </p>
        <p className="mb-2 text-[0.7rem] text-slate-400">
          or click below to browse a local <span className="font-semibold">.csv</span> file.
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-[0.7rem] font-medium text-slate-100 shadow-sm hover:bg-slate-700">
          <span>{hasFile ? "Change file" : "Choose file"}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
        {hasFile && (
          <p className="mt-2 text-[0.68rem] text-emerald-300">
            Local file loaded · Click "Validate CSV" to send it to the API.
          </p>
        )}
      </motion.div>

      <label className="mb-2 block text-xs font-medium text-slate-200">
        Or paste CSV text
        <textarea
          className="mt-1 h-28 w-full resize-none rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-emerald-500/50 focus:ring-2"
          placeholder="EngineSize,Cylinders,FuelType,FuelConsumption,CO2Emissions&#10;1.8,4,Gasoline,7.8,170&#10;..."
          value={localCsvText}
          onChange={(e) => {
            setLocalCsvText(e.target.value);
            setPreview(parsePreview(e.target.value));
          }}
        />
      </label>

      <button
        type="button"
        onClick={handleValidate}
        disabled={isValidating}
        className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/60"
      >
        {isValidating ? "Validating..." : "Validate CSV"}
      </button>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800/80">
        {isValidating ? (
          <motion.div
            className="h-full rounded-full bg-emerald-400"
            initial={{ width: "10%" }}
            animate={{ width: `${Math.max(progress, 40)}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        ) : (
          <div className="h-full w-0" />
        )}
      </div>

      {rowsInfo && (
        <p className="mt-2 text-[0.7rem] text-emerald-300">
          ✓ Valid dataset with {rowsInfo.rows} rows and{" "}
          {rowsInfo.columns.length} columns.
        </p>
      )}

      {preview.header.length > 0 && (
        <div className="mt-4 max-h-48 overflow-auto rounded-xl border border-slate-700/60 bg-slate-950/60 text-[0.7rem] backdrop-blur-md">
          <table className="w-full table-fixed border-collapse">
            <thead className="bg-slate-900/80 text-slate-200">
              <tr>
                {preview.header.map((h) => (
                  <th key={h} className="px-2 py-1 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"}
                >
                  {row.map((cell, cIdx) => (
                    <td key={`${idx}-${cIdx}`} className="truncate px-2 py-1">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.section>
  );
}

export default UploadPanel;