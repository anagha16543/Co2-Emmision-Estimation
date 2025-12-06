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


def create_preprocessor(
    df: pd.DataFrame,
    target_col: str = "CO2Emissions",
) -> Tuple[ColumnTransformer, List[str], List[str]]:
    """
    Build a ColumnTransformer with scaling for numeric and one-hot for categoricals.
    Now includes imputation for missing values.
    """
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in DataFrame.")

    feature_df = df.drop(columns=[target_col])
    
    # Remove columns that are completely empty
    feature_df = feature_df.dropna(axis=1, how='all')
    
    num_cols: List[str] = []
    cat_cols: List[str] = []

    for col in feature_df.columns:
        # Try to convert to numeric first
        try:
            feature_df[col] = pd.to_numeric(feature_df[col], errors='coerce')
            if feature_df[col].notna().any():  # If any non-null numeric values
                num_cols.append(col)
            else:
                cat_cols.append(col)
        except:
            cat_cols.append(col)

    # Sort for reproducibility
    num_cols = sorted(num_cols)
    cat_cols = sorted(cat_cols)

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
        raise ValueError("No feature columns found to preprocess after cleaning.")

    preprocessor = ColumnTransformer(transformers=transformers)

    return preprocessor, num_cols, cat_cols


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
    Train a pipeline and (for ridge/lasso) search over alpha.
    Now handles missing values through imputation.
    """
    try:
        if target_col not in df.columns:
            return {"error": f"Target column '{target_col}' not found in DataFrame."}

        # Drop rows where target is missing
        df = df.dropna(subset=[target_col]).copy()
        
        # Check if we have enough data
        if len(df) < 10:
            return {"error": f"Not enough data after cleaning. Need at least 10 rows, got {len(df)}."}
        
        X = df.drop(columns=[target_col])
        y = df[target_col]
        
        # Check if target has variance
        if y.nunique() <= 1:
            return {"error": "Target column has no variance (all values are the same)."}
        
        # Ensure y is numeric
        y = pd.to_numeric(y, errors='coerce')
        if y.isna().any():
            return {"error": "Target column contains non-numeric values."}

        # Create preprocessor
        try:
            preprocessor, num_cols, cat_cols = create_preprocessor(df, target_col=target_col)
        except Exception as e:
            return {"error": f"Failed to create preprocessor: {str(e)}"}

        # Check if we have any features
        if len(num_cols) == 0 and len(cat_cols) == 0:
            return {"error": "No valid features found after preprocessing."}

        model_type = model_type.lower()

        if model_type == "linear":
            base_model = LinearRegression()
            pipeline = Pipeline(
                steps=[
                    ("preprocessor", preprocessor),
                    ("model", base_model),
                ]
            )
            metrics = evaluate_model_cv(pipeline, X, y, cv=cv)
            best_params = {"model": "linear", "best_alpha": None}
            pipeline.fit(X, y)
            return {"pipeline": pipeline, "metrics": metrics, "best_params": best_params}

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
        n_samples = len(X)
        if n_samples < cv:
            cv = max(2, n_samples - 1)
        
        param_grid = {"model__alpha": alpha_grid}
        kf = KFold(n_splits=cv, shuffle=True, random_state=42)

        gs = GridSearchCV(
            pipeline,
            param_grid=param_grid,
            scoring="neg_root_mean_squared_error",
            cv=kf,
            n_jobs=1,
            error_score='raise'
        )
        gs.fit(X, y)

        best_pipeline = gs.best_estimator_
        best_alpha = float(gs.best_params_["model__alpha"])

        metrics = evaluate_model_cv(best_pipeline, X, y, cv=cv)
        best_params = {"model": model_type, "best_alpha": best_alpha}

        return {"pipeline": best_pipeline, "metrics": metrics, "best_params": best_params}
        
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