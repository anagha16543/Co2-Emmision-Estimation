import pandas as pd
from backend.model_utils import train_and_select, clean_and_classify_features

def test_feature_metadata():
    # Create dummy data with numeric and categorical columns
    df = pd.DataFrame({
        'Engine Size': [2.0, 3.0, 1.5, 2.0, 3.0] * 10,
        'Cylinders': [4, 6, 4, 4, 6] * 10,
        'Fuel Type': ['Z', 'X', 'Z', 'E', 'D'] * 10,
        'Transmission': ['A4', 'M5', 'A4', 'M6', 'A5'] * 10,
        'CO2Emissions': [200, 300, 150, 200, 250] * 10
    })

    print("Training model...")
    # Train model
    result = train_and_select(df, target_col='CO2Emissions')
    
    if "error" in result:
        print(f"Error: {result['error']}")
        exit(1)

    features_info = result.get('features_info')
    if not features_info:
        print("FAIL: features_info missing from result")
        exit(1)

    print("Success! features_info found:")
    print(features_info)

    # Verify content
    if 'Engine Size' in features_info and features_info['Engine Size']['type'] == 'number':
        print("PASS: Engine Size identified as number")
    else:
        print("FAIL: Engine Size not correct")

    if 'Fuel Type' in features_info and features_info['Fuel Type']['type'] == 'select':
        print(f"PASS: Fuel Type identified as select with options: {features_info['Fuel Type']['options']}")
    else:
        print("FAIL: Fuel Type not correct")

if __name__ == "__main__":
    test_feature_metadata()
