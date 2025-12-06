import textwrap
from io import StringIO
from pathlib import Path

import pandas as pd
from sklearn.pipeline import Pipeline

from model_utils import (
    create_preprocessor,
    train_and_select,
    save_pipeline,
    load_pipeline,
)


SAMPLE_CSV = textwrap.dedent(
    """\
    EngineSize,Cylinders,FuelType,FuelConsumption,CO2Emissions
    1.8,4,Gasoline,7.8,170
    2.4,4,Gasoline,9.2,210
    3.5,6,Gasoline,12.5,290
    1.6,4,Diesel,6.5,150
    2.0,4,Hybrid,5.4,110
    4.0,8,Gasoline,15.0,340
    2.2,4,Diesel,8.0,200
    """
)


def _load_sample_df() -> pd.DataFrame:
    return pd.read_csv(StringIO(SAMPLE_CSV))


def test_create_preprocessor():
    df = _load_sample_df()
    preprocessor, num_cols, cat_cols = create_preprocessor(df, target_col="CO2Emissions")

    assert isinstance(num_cols, list)
    assert isinstance(cat_cols, list)
    # Expected columns for this dataset
    assert set(num_cols) == {"EngineSize", "Cylinders", "FuelConsumption"}
    assert set(cat_cols) == {"FuelType"}
    assert "CO2Emissions" not in num_cols + cat_cols
    assert preprocessor is not None


def test_train_and_select_ridge():
    df = _load_sample_df()
    result = train_and_select(df, target_col="CO2Emissions", model_type="ridge", cv=3)

    pipeline = result["pipeline"]
    metrics = result["metrics"]
    best_params = result["best_params"]

    assert isinstance(pipeline, Pipeline)
    assert set(metrics.keys()) == {"RMSE", "MAE", "R2"}
    assert all(isinstance(v, float) for v in metrics.values())
    assert best_params["model"] == "ridge"
    assert isinstance(best_params["best_alpha"], float)


def test_save_and_load_pipeline(tmp_path: Path):
    df = _load_sample_df()
    # Use linear to keep it fast
    result = train_and_select(df, target_col="CO2Emissions", model_type="linear", cv=3)
    pipeline = result["pipeline"]

    path = tmp_path / "test_model.joblib"
    save_pipeline(path, pipeline)

    assert path.exists()

    loaded = load_pipeline(path)
    assert isinstance(loaded, Pipeline)

    # Make a simple prediction using the first row
    X = df.drop(columns=["CO2Emissions"]).iloc[[0]]
    y_pred = loaded.predict(X)
    assert y_pred.shape == (1,)