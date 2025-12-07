import pandas as pd
from backend.model_utils import train_and_select
import numpy as np

# Create a dataframe with missing values in features
df = pd.DataFrame({
    'EngineSize': [2.0, 1.5, np.nan, 3.0, 2.5, 1.0, 2.0, 3.5, np.nan, 4.0] * 5, # 50 rows
    'Cylinders': [4, 4, 6, 6, 4, 3, 4, 8, 4, 8] * 5,
    'FuelType': ['Gasoline', 'Diesel', 'Gasoline', np.nan, 'Hybrid', 'Gasoline', 'Diesel', 'Gasoline', 'Hybrid', 'Diesel'] * 5,
    'CO2Emissions': [200, 150, 220, 180, 120, 100, 210, 300, 110, 320] * 5 # No missing targets
})

print(f"Dataset shape: {df.shape}")
print(f"Missing values:\n{df.isnull().sum()}")

# Train model
print("\nTraining model...")
try:
    result = train_and_select(df, model_type="ridge")
    if "error" in result:
        print(f"FAILED: {result['error']}")
    else:
        print("SUCCESS: Model trained successfully.")
        print("Metrics:", result["metrics"])
except Exception as e:
    print(f"CRASHED: {e}")
