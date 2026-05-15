import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score
import mlflow
import shap

# Generate synthetic sensor time series data
np.random.seed(42)
n_samples = 500
X = pd.DataFrame({
    'vibration_mean': np.random.uniform(0, 10, n_samples),
    'vibration_std': np.random.uniform(0, 5, n_samples),
    'temperature_mean': np.random.uniform(50, 100, n_samples),
    'temperature_std': np.random.uniform(0, 10, n_samples),
    'pressure_mean': np.random.uniform(1, 5, n_samples),
    'pressure_rolling_7d': np.random.uniform(1, 5, n_samples)
})
y = np.random.binomial(1, 0.15, n_samples)  # 15% failure rate

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)

# Build pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('rf', RandomForestClassifier(n_estimators=100, random_state=42))
])

# MLflow experiment tracking
mlflow.set_experiment('predictive_maintenance')
with mlflow.start_run():
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    
    mlflow.log_metric('precision', precision)
    mlflow.log_metric('recall', recall)
    mlflow.sklearn.log_model(pipeline, 'model')

# SHAP explanations
explainer = shap.TreeExplainer(
    pipeline.named_steps['rf']
)
shap_values = explainer.shap_values(X_test)

print(f'Precision: {precision:.4f}')
print(f'Recall: {recall:.4f}')
print(f'Feature Importances: {pipeline.named_steps["rf"].feature_importances_}')