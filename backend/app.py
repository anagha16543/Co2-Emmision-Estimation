import os
# FORCE SINGLE THREADING TO FIX CRASHES
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

from datetime import datetime, timedelta
from io import StringIO
from pathlib import Path
import json
import traceback
import json
import traceback
import numpy as np
import sys

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd
from sqlalchemy import func

from model_utils import train_and_select, save_pipeline, load_pipeline

# ---------------------------------------------------------------------
# APP & CONFIG
# ---------------------------------------------------------------------
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "super-secret-key-change-this-in-production"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=60)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)

CORS(app)
db = SQLAlchemy(app)
jwt = JWTManager(app)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "saved_models"
MODEL_PATH = MODEL_DIR / "best_model.joblib"
METADATA_PATH = MODEL_DIR / "metadata.json"

# ---------------------------------------------------------------------
# USER MODEL
# ---------------------------------------------------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default="user")  # 'user' or 'admin'

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


# Initialize DB
with app.app_context():
    db.create_all()

# ---------------------------------------------------------------------
# COLUMN CONFIG FOR KAGGLE CAR EMISSIONS DATASET
# ---------------------------------------------------------------------
REQUIRED_COLUMNS = [
    "EngineSize",
    "CO2Emissions",
]

COLUMN_MAPPING = {
    # Engine size
    "engine size (l)": "EngineSize",
    "engine size": "EngineSize",
    "engine (l)": "EngineSize",
    "engine size(l)": "EngineSize",
    "enginesize": "EngineSize",

    # Cylinders
    "cylinders": "Cylinders",

    # Fuel type
    "fuel type": "FuelType",
    "fueltype": "FuelType",

    # Fuel consumption (common Kaggle variants)
    "fuel consumption comb (l/100 km)": "FuelConsumption",
    "fuel consumption comb (mpg)": "FuelConsumption",
    "fuelconsumption": "FuelConsumption",
    "metric combined": "FuelConsumption",
    "fuel consumption comb l/100 km": "FuelConsumption",
    "fuel consumption comb": "FuelConsumption",

    # CO2 emissions
    "co2 emissions(g/km)": "CO2Emissions",
    "co2 emissions": "CO2Emissions",
    "co2 g/km": "CO2Emissions",
    "co2emissions": "CO2Emissions"
}

# ---------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------
def convert_to_serializable(obj):
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, (np.bool_)):
        return bool(obj)
    elif isinstance(obj, (np.ndarray)):
        return obj.tolist()
    elif isinstance(obj, pd.Series):
        return obj.tolist()
    elif isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient='records')
    elif hasattr(obj, 'item'):
        try:
            return obj.item()
        except Exception:
            return str(obj)
    elif isinstance(obj, float) and pd.isna(obj):
        return None
    else:
        return obj


def _parse_csv_text(csv_text: str) -> pd.DataFrame:
    if not csv_text:
        raise ValueError("CSV text is empty.")

    csv_text = csv_text.strip()
    if not csv_text:
        raise ValueError("CSV text is empty after trimming.")

    try:
        # If bytes, try multiple decodings
        if isinstance(csv_text, bytes):
            decodings = ["utf-8", "latin-1", "utf-16", "cp1252"]
            content = None
            for encoding in decodings:
                try:
                    content = csv_text.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            if content is None:
                raise ValueError("Unable to decode file encoding.")
            csv_text = content

        # Try fast C engine first
        try:
            df = pd.read_csv(StringIO(csv_text), on_bad_lines='skip')
        except Exception:
            # Fallback to python engine
            try:
                df = pd.read_csv(
                    StringIO(csv_text),
                    sep=None,
                    engine='python',
                    on_bad_lines='skip'
                )
            except Exception:
                # Last resort: whitespace-delimited
                df = pd.read_csv(StringIO(csv_text), delim_whitespace=True)

        if df.empty:
            raise ValueError("CSV parsed but resulted in empty DataFrame.")

        return df

    except Exception as exc:
        print(f"CSV parsing error: {traceback.format_exc()}")
        raise ValueError(f"Failed to parse CSV: {str(exc)}") from exc


def _read_csv_from_request() -> pd.DataFrame:
    try:
        # If file uploaded
        if "file" in request.files and request.files["file"].filename:
            file_storage = request.files["file"]
            if not file_storage.filename.lower().endswith('.csv'):
                raise ValueError("Please upload a CSV file.")

            csv_bytes = file_storage.read()
            if not csv_bytes:
                raise ValueError("Uploaded file is empty.")

            return _parse_csv_text(csv_bytes)

        # Or csv_text in JSON body
        payload = request.get_json(silent=True) or {}
        csv_text = payload.get("csv_text")
        if not csv_text:
            raise ValueError("No CSV file or csv_text provided.")

        return _parse_csv_text(csv_text)

    except Exception as exc:
        raise ValueError(f"Error reading CSV from request: {str(exc)}") from exc


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Case-insensitive, fuzzy mapping of column names to a standard schema.
    """
    new_cols = {}
    for col in df.columns:
        clean_col = col.lower().strip()

        if clean_col in COLUMN_MAPPING:
            new_cols[col] = COLUMN_MAPPING[clean_col]
            continue

        # Fuzzy mappings
        if "engine" in clean_col and "size" in clean_col:
            new_cols[col] = "EngineSize"
        elif "co2" in clean_col and "emission" in clean_col:
            new_cols[col] = "CO2Emissions"
        elif "fuel" in clean_col and "consumption" in clean_col: # Relaxed: 'comb' not strictly required
            new_cols[col] = "FuelConsumption"
        elif "fuel" in clean_col and "type" in clean_col:
            new_cols[col] = "FuelType"
        elif "cylinder" in clean_col:
            new_cols[col] = "Cylinders"

    return df.rename(columns=new_cols)


def _enforce_numeric_types(df: pd.DataFrame) -> pd.DataFrame:
    """
    Strip units like '196 g/km' -> '196' then convert to numeric.
    """
    numeric_columns = ["EngineSize", "Cylinders", "FuelConsumption", "CO2Emissions"]
    for col in numeric_columns:
        if col in df.columns:
            if df[col].dtype == object:
                df[col] = df[col].astype(str).str.replace(r'[^\d\.]', '', regex=True)
            df[col] = pd.to_numeric(df[col], errors='coerce')
    return df


def _ensure_required_columns(df: pd.DataFrame) -> list:
    warnings = []
    if df is None or df.empty:
        raise ValueError("DataFrame is empty or None.")

    if "CO2Emissions" not in df.columns:
        warnings.append("Missing target column 'CO2Emissions' (required for training)")

    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) < 2:
        warnings.append("Dataset needs at least one numeric feature besides the target.")
    
    return warnings


def _analyze_dataset(df: pd.DataFrame) -> dict:
    analysis = {
        "total_rows": int(len(df)),
        "missing_values": {},
        "data_types": {},
        "warnings": [],
        "sample_data": {}
    }

    # Add validation warnings
    validation_warnings = _ensure_required_columns(df)
    analysis["warnings"].extend(validation_warnings)

    for col in df.columns:
        missing = int(df[col].isnull().sum())
        analysis["missing_values"][col] = missing
        analysis["data_types"][col] = str(df[col].dtype)

        non_null_vals = df[col].dropna()
        analysis["sample_data"][col] = convert_to_serializable(
            non_null_vals.iloc[0] if len(non_null_vals) else "No data"
        )

        if missing > 0:
            analysis["warnings"].append(f"Column '{col}' has {missing} missing values")

    if "CO2Emissions" in df.columns:
        non_missing = int(df["CO2Emissions"].notna().sum())
        if non_missing < 5:
            analysis["warnings"].append("Need at least 5 valid CO2Emissions rows")

    return json.loads(json.dumps(analysis, default=convert_to_serializable))

# ---------------------------------------------------------------------
# UPLOAD ENDPOINT (VALIDATION ONLY)
# ---------------------------------------------------------------------
@app.route("/upload", methods=["POST"])
def upload():
    try:
        df = _read_csv_from_request()
        df = _normalize_columns(df)
        df = _enforce_numeric_types(df)
        
        # Don't raise error, just analyze
        analysis = _analyze_dataset(df)

        return jsonify({
            "success": True,
            "rows": int(df.shape[0]),
            "columns": [str(c) for c in df.columns.tolist()],
            "analysis": analysis,
            "message": "Dataset processed (check warnings if any)"
        })

    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"success": False, "error": f"Unexpected error: {exc}"}), 400

# ---------------------------------------------------------------------
# AUTH ROUTES
# ---------------------------------------------------------------------
@app.route("/auth/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    username = username.lower().strip()

    # Case-insensitive check for existing user
    if User.query.filter(func.lower(User.username) == username).first():
        return jsonify({"error": "Username already exists"}), 400

    try:
        new_user = User(username=username)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Signup error: {e}")
        return jsonify({"error": "Failed to create account"}), 500

    return jsonify({"message": "User created successfully"}), 201


@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    print(f"DEBUG RAW PAYLOAD: {request.get_data(as_text=True)}", flush=True)
    
    username = data.get("username")
    password = data.get("password")
    
    print(f"DEBUG PASSWORD REPR: {repr(password)}", flush=True)

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    username = username.lower().strip()
    print(f"DEBUG: Login attempt for normalized username: '{username}'", flush=True)

    # Case-insensitive lookup
    user = User.query.filter(func.lower(User.username) == username).first()
    
    if user:
        print(f"DEBUG: User found: {user.username}", flush=True)
        password_valid = user.check_password(password)
        print(f"DEBUG: Password valid: {password_valid}", flush=True)
    else:
        print("DEBUG: User NOT found in database", flush=True)

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=user.id,
        additional_claims={"role": user.role, "username": user.username}
    )
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {"username": user.username, "role": user.role}
    }), 200


@app.route("/auth/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    # Keep same claims on refresh
    access_token = create_access_token(
        identity=current_user_id,
        additional_claims={"role": user.role, "username": user.username} if user else {}
    )
    return jsonify(access_token=access_token), 200


@app.route("/auth/logout", methods=["POST"])
def logout():
    # Client discards tokens; no server-side blocklist here.
    return jsonify({"message": "Logged out"}), 200


@app.route("/auth/me", methods=["GET"])
@jwt_required()
def get_me():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"username": user.username, "role": user.role}), 200

# ---------------------------------------------------------------------
# TRAIN ENDPOINT
# ---------------------------------------------------------------------
@app.route("/train", methods=["POST"])
@jwt_required()
def train():
    payload = request.get_json(silent=False) or {}
    csv_text = payload.get("csv_text")
    model_type = (payload.get("model") or "ridge").lower()
    cv = payload.get("cv", 5)

    if not csv_text:
        return jsonify({"error": "csv_text is required in request body."}), 400

    if not isinstance(cv, int) or cv < 2:
        return jsonify({"error": "cv must be an integer >= 2."}), 400

    try:
        df = _parse_csv_text(csv_text)
        df = _normalize_columns(df)
        df = _enforce_numeric_types(df)
        _ensure_required_columns(df)

        analysis = _analyze_dataset(df)  # Not used, but you can send to frontend if needed
        original_rows = len(df)

        df_clean = df.dropna(subset=["CO2Emissions"])
        dropped = original_rows - len(df_clean)

        if len(df_clean) < 5:
            return jsonify({
                "error": (
                    f"Not enough valid data rows. Found {len(df_clean)} valid rows out of "
                    f"{original_rows} total. Check if your CO2Emissions column contains valid numbers."
                )
            }), 400

        result = train_and_select(df_clean, "CO2Emissions", model_type, cv)

        # Handle error returned by train_and_select
        if isinstance(result, dict) and "error" in result:
            return jsonify({"error": result["error"]}), 400

        pipeline = result["pipeline"]
        metrics = result["metrics"]
        best_params = result["best_params"]

        # Ensure model directory exists BEFORE saving
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        save_pipeline(MODEL_PATH, pipeline)

        serializable_metrics = {
            "RMSE": float(metrics["RMSE"]),
            "MAE": float(metrics["MAE"]),
            "R2": float(metrics["R2"]),
        }

        metadata = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "model_type": best_params.get("model"),
            "best_alpha": best_params.get("best_alpha"),
            "metrics": serializable_metrics
        }

        METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

        return jsonify({
            "success": True,
            "metrics": serializable_metrics,
            "params": best_params,
            "message": f"Model trained! {dropped} rows removed."
        })

    except Exception as exc:
        traceback.print_exc()
        return jsonify({"error": f"Training failed: {exc}"}), 400

# ---------------------------------------------------------------------
# PREDICT ENDPOINT
# ---------------------------------------------------------------------
@app.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    payload = request.get_json(silent=False) or {}
    features = payload.get("features")

    if not isinstance(features, dict):
        return jsonify({"error": "Body must contain 'features' dict"}), 400

    if not MODEL_PATH.exists():
        return jsonify({"error": "No trained model found"}), 400

    try:
        pipeline = load_pipeline(MODEL_PATH)
    except Exception as exc:
        return jsonify({"error": f"Failed to load model: {exc}"}), 400

    df = pd.DataFrame([features])

    # Ensure correct feature order if available
    if hasattr(pipeline, "feature_names_in_"):
        expected = list(pipeline.feature_names_in_)
        missing = [c for c in expected if c not in df.columns]
        if missing:
            return jsonify({"error": f"Missing features: {missing}"}), 400
        df = df[expected]

    try:
        pred = float(pipeline.predict(df)[0])
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {exc}"}), 400

    return jsonify({"prediction": pred})

# ---------------------------------------------------------------------
# MODEL METADATA & DOWNLOAD
# ---------------------------------------------------------------------
@app.route("/model", methods=["GET"])
def get_metadata():
    if METADATA_PATH.exists():
        return jsonify(json.loads(METADATA_PATH.read_text()))
    return jsonify({"error": "No model metadata"}), 404


@app.route("/metrics", methods=["GET"])
def get_metrics():
    if METADATA_PATH.exists():
        meta = json.loads(METADATA_PATH.read_text())
        return jsonify(meta.get("metrics", {}))
    return jsonify({"error": "No metrics"}), 404


@app.route("/model/download", methods=["GET"])
def download_model():
    from flask import send_file
    if MODEL_PATH.exists():
        return send_file(MODEL_PATH, as_attachment=True, download_name="co2_model.joblib")
    return jsonify({"error": "No model found"}), 404

# ---------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------
if __name__ == "__main__":
    # debug=False to prevent Windows ntdll.dll crashes in some environments
    app.run(host="0.0.0.0", port=5000, debug=False)
