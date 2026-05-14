import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error
from feature_engine.outliers import OutlierCapper
from catboost import CatBoostRegressor
import shap

# Synthetic insurance claims data
np.random.seed(42)
n_claims = 600
X = pd.DataFrame({
    'vehicle_age': np.random.randint(0, 20, n_claims),
    'driver_age': np.random.randint(18, 80, n_claims),
    'accident_type': np.random.choice(['Collision', 'Theft', 'Weather'], n_claims),
    'accident_severity': np.random.choice(['Minor', 'Major', 'Critical'], n_claims)
})

# Claim amount (dependent on features)
y = (5000 + X['vehicle_age']*500 + 
     (80-X['driver_age'])*200 + 
     np.random.exponential(3000, n_claims))

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# Feature engineering
outiercapper = OutlierCapper()
X_train_capped = X_train.copy()
X_test_capped = X_test.copy()

# CatBoost for categorical handling
cat_features = ['accident_type', 'accident_severity']
model = CatBoostRegressor(
    cat_features=cat_features,
    random_state=42,
    verbose=0
)

model.fit(X_train_capped, y_train)
y_pred = model.predict(X_test_capped)

rmse = np.sqrt(mean_squared_error(y_test, y_pred))
mape = mean_absolute_percentage_error(y_test, y_pred)

# SHAP explanations
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test_capped)

print(f'RMSE: ${rmse:.2f}')
print(f'MAPE: {mape:.4f}')
print(f'Feature Importances: {model.feature_importances_}')