import numpy as np
import pandas as pd
from sklearn.datasets import fetch_california_housing
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
from skrub import TableVectorizer
from yellowbrick.regressor import PredictionError, ResidualsPlot
import shap

# Load housing dataset
housing = fetch_california_housing()
X = pd.DataFrame(housing.data, columns=housing.feature_names)
y = housing.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Pipeline with XGBoost
pipeline = Pipeline([
    ('vectorizer', TableVectorizer()),
    ('xgb', XGBRegressor(random_state=42, n_estimators=100))
])

pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)

# Metrics
r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

# Yellowbrick visualization data
residuals = y_test - y_pred

# SHAP explanations
xgb = pipeline.named_steps['xgb']
explainer = shap.TreeExplainer(xgb)
shap_values = explainer.shap_values(X_test.values)

# Feature importances from SHAP
feature_importance = np.abs(shap_values).mean(axis=0)
top_features_idx = np.argsort(feature_importance)[-5:][::-1]

print(f'R2 Score: {r2:.4f}')
print(f'RMSE: ${rmse*100000:.0f}')
print('Top 5 Important Features:')
for i in top_features_idx:
    print(f'  {X.columns[i]}: {feature_importance[i]:.4f}')
print(f'Model RMSE on test set: {rmse:.4f}')