from pathlib import Path
from typing import Any, Dict, List, Tuple, Optional
import numpy as np
import pandas as pd
from joblib import dump, load
from pandas.api.types import is_numeric_dtype
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import Lasso, LinearRegression, Ridge
from sklearn.model_selection import GridSearchCV, KFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.exceptions import ConvergenceWarning
import warnings

# Suppress warnings during training
warnings.filterwarnings('ignore', category=ConvergenceWarning)
warnings.filterwarnings('ignore', category=UserWarning)


def clean_and_classify_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str], List[str]]:
    """
    Cleans features by coercing to numeric where appropriate and classifying columns.
    Returns: (cleaned_df, numeric_columns, categorical_columns)
    """
    # Create a copy to avoid SettingWithCopy warnings
    clean_df = df.copy()
    
    # Remove columns that are completely empty
    clean_df = clean_df.dropna(axis=1, how='all')
    
    num_cols: List[str] = []
    cat_cols: List[str] = []

    for col in clean_df.columns:
        # Try to convert to numeric
        numeric_series = pd.to_numeric(clean_df[col], errors='coerce')
        
        # Calculate ratio of valid numeric values
        # If > 50% are valid numbers, treat as numeric
        valid_ratio = numeric_series.notna().mean()
        
        if valid_ratio > 0.5:
            clean_df[col] = numeric_series
            num_cols.append(col)
        else:
            # Treat as categorical
            # Check cardinality: if too many unique values, drop it to prevent massive expansion
            # (e.g. "Model" in car datasets can have 1000+ unique values)
            clean_df[col] = clean_df[col].astype(str)
            n_unique = clean_df[col].nunique()
            
            if n_unique <= 20:
                cat_cols.append(col)
            # else: drop, effectively ignoring this column for training

    return clean_df, sorted(num_cols), sorted(cat_cols)



def create_preprocessor(
    num_cols: List[str],
    cat_cols: List[str]
) -> ColumnTransformer:
    """
    Build a ColumnTransformer given lists of numeric and categorical columns.
    """
    transformers = []
    if num_cols:
        transformers.append(
            (
                "num",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="mean")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                num_cols,
            )
        )
    if cat_cols:
        transformers.append(
            (
                "cat",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
                    ]
                ),
                cat_cols,
            )
        )

    if not transformers:
        # Fallback if everything was dropped? Should not happen often.
        raise ValueError("No feature columns found to preprocess.")

    return ColumnTransformer(transformers=transformers)


def evaluate_model_cv(
    pipeline: Pipeline,
    X: pd.DataFrame,
    y: pd.Series,
    cv: int,
) -> Dict[str, float]:
    """
    Compute cross-validated RMSE, MAE, and R².
    """
    # Ensure we have enough samples for cross-validation
    n_samples = len(X)
    if n_samples < cv:
        cv = max(2, n_samples - 1)
    
    kf = KFold(n_splits=cv, shuffle=True, random_state=42)
    scoring = {
        "rmse": "neg_root_mean_squared_error",
        "mae": "neg_mean_absolute_error",
        "r2": "r2",
    }

    try:
        cv_results = cross_validate(
            pipeline,
            X,
            y,
            cv=kf,
            scoring=scoring,
            n_jobs=1,
            return_train_score=False,
        )

        rmse = -float(cv_results["test_rmse"].mean())
        mae = -float(cv_results["test_mae"].mean())
        r2 = float(cv_results["test_r2"].mean())

        return {"RMSE": rmse, "MAE": mae, "R2": r2}
    except Exception as e:
        # Fallback to train-test split if CV fails
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        return {"RMSE": rmse, "MAE": mae, "R2": r2}


def train_and_select(
    df: pd.DataFrame,
    target_col: str = "CO2Emissions",
    model_type: str = "ridge",
    cv: int = 5,
) -> Dict[str, Any]:
    """
    Train a pipeline and search over alpha.
    """
    try:
        if target_col not in df.columns:
            return {"error": f"Target column '{target_col}' not found in DataFrame."}

        # Drop rows where target is missing
        df = df.dropna(subset=[target_col]).copy()
        
        # Check if we have enough data
        if len(df) < 10:
            return {"error": f"Not enough data after cleaning. Need at least 10 rows, got {len(df)}."}
        
        X_raw = df.drop(columns=[target_col])
        y = df[target_col]
        
        # Check if target has variance
        if y.nunique() <= 1:
            return {"error": "Target column has no variance (all values are the same)."}
        
        # Ensure y is numeric
        y = pd.to_numeric(y, errors='coerce')
        if y.isna().any():
            return {"error": "Target column contains non-numeric values."}

        # --- FEATURE SELECTION (User Request: Top 5 Important Features) ---
        # We prioritize physics-based features known to affect CO2.
        # Primary: Check for standard normalized names (from app.py _normalize_columns)
        target_features_priority = [
            "EngineSize",
            "Cylinders",
            "FuelConsumption",
            "FuelType", 
            "VehicleClass"
        ]
        
        # Secondary patterns if exact names not found
        important_patterns = [
            r"engine.*size",       
            r"cylinders?",          
            r"fuel.*cons",         # Broader: catch any consumption
            r"fuel.*type",         
            r"vehicle.*class"
        ]
        
        selected_cols = []
        
        
        # 1. Try exact matches first
        for target in target_features_priority:
            if target in X_raw.columns:
                selected_cols.append(target)
        
        # 2. If we found fewer than 5, try regex on REMAINING columns to find standard features
        # only if we haven't found that category yet
        lower_cols = {c.lower(): c for c in X_raw.columns if c not in selected_cols}
        import re
        for pattern in important_patterns:
            for col_lower, original_col in lower_cols.items():
                if re.search(pattern, col_lower) and original_col not in selected_cols:
                    selected_cols.append(original_col)
                    break 
        
        # 3. STRICT MODE: Do NOT fill with random remaining columns.
        # Use only what was found from the priority list/regex.
        
        print(f"DEBUG: Selected Strictly {len(selected_cols)} features: {selected_cols}")
        if not selected_cols:
             return {"error": "Could not find any of the required vehicle features (Engine, Cylinders, Fuel, Class) in the dataset."}
             
        X_raw = X_raw[selected_cols]
        # ------------------------------------------------------------------

        # CLEAN AND CLASSIFY FEATURES
        # This gives us X_clean where numeric columns are actually numeric (with NaNs)
        try:
            X_clean, num_cols, cat_cols = clean_and_classify_features(X_raw)
        except Exception as e:
             return {"error": f"Feature preprocessing failed: {str(e)}"}

        # Create preprocessor
        try:
             preprocessor = create_preprocessor(num_cols, cat_cols)
        except Exception as e:
            return {"error": f"Failed to create preprocessor: {str(e)}"}
            
        print(f"DEBUG: Num cols: {len(num_cols)}, Cat cols: {len(cat_cols)}")

        model_type = model_type.lower()

        if model_type == "linear":
            base_model = LinearRegression()
            pipeline = Pipeline(
                steps=[
                    ("preprocessor", preprocessor),
                    ("model", base_model),
                ]
            )
            best_params = {"model": "linear", "best_alpha": None}
            pipeline.fit(X_clean, y)
            
            features_info = {}
            for col in num_cols:
                 features_info[col] = {"type": "number"}
            for col in cat_cols:
                 unique_vals = sorted(X_clean[col].dropna().unique().tolist())
                 features_info[col] = {"type": "select", "options": unique_vals}

            return {
                "pipeline": pipeline, 
                "metrics": metrics, 
                "best_params": best_params,
                "features_info": features_info
            }

        if model_type == "ridge":
            model = Ridge(random_state=42)
            alpha_grid = [0.01, 0.1, 1, 10, 50, 100, 200]
        elif model_type == "lasso":
            model = Lasso(max_iter=10000, random_state=42)
            alpha_grid = [0.001, 0.01, 0.1, 1, 10, 50]
        else:
            return {"error": "model_type must be one of: 'linear', 'ridge', 'lasso'."}

        pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("model", model),
            ]
        )
        
        # Adjust cv if not enough samples
        n_samples = len(X_clean)
        if n_samples < cv:
            cv = max(2, n_samples - 1)
        
        param_grid = {"model__alpha": alpha_grid}
        kf = KFold(n_splits=cv, shuffle=True, random_state=42)
        
        # Use X_clean for fitting
        gs = GridSearchCV(
            pipeline,
            param_grid=param_grid,
            scoring="neg_root_mean_squared_error",
            cv=kf,
            n_jobs=1,
            error_score='raise'
        )
        gs.fit(X_clean, y)

        best_pipeline = gs.best_estimator_
        best_alpha = float(gs.best_params_["model__alpha"])

        metrics = evaluate_model_cv(best_pipeline, X_clean, y, cv=cv)
        best_params = {"model": model_type, "best_alpha": best_alpha}

        # Build feature metadata for frontend
        features_info = {}
        # Numeric features
        for col in num_cols:
             features_info[col] = {"type": "number"}
        
        # Categorical features with options
        for col in cat_cols:
             unique_vals = sorted(X_clean[col].dropna().unique().tolist())
             features_info[col] = {"type": "select", "options": unique_vals}

        return {
            "pipeline": best_pipeline, 
            "metrics": metrics, 
            "best_params": best_params,
            "features_info": features_info
        }

    except Exception as e:
        return {"error": f"Training failed: {str(e)}"}


def save_pipeline(path: Path | str, pipeline: Pipeline) -> None:
    """Persist a fitted pipeline to disk."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    dump(pipeline, p, compress=3)


def load_pipeline(path: Path | str) -> Pipeline:
    """Load a previously saved pipeline."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Pipeline file not found at {p}")
    return load(p)