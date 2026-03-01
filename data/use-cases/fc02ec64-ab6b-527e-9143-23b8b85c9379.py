import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from xgboost import XGBClassifier
import shap

# Generate imbalanced fraud data
X, y = make_classification(
    n_samples=10000,
    n_features=20,
    n_informative=15,
    n_redundant=5,
    weights=[0.97, 0.03],
    random_state=42
)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)

# Pipeline with SMOTE and XGBClassifier
pipeline = ImbPipeline([
    ('scaler', StandardScaler()),
    ('smote', SMOTE(random_state=42)),
    ('xgb', XGBClassifier(scale_pos_weight=32, random_state=42))
])

pipeline.fit(X_train, y_train)
y_pred_proba = pipeline.predict_proba(X_test)[:, 1]
roc_auc = roc_auc_score(y_test, y_pred_proba)

# SHAP explanations
explainer = shap.TreeExplainer(pipeline.named_steps['xgb'])
shap_values = explainer.shap_values(X_test)

# Get top 3 important features
feature_importance = np.abs(shap_values).mean(axis=0)
top_features = np.argsort(feature_importance)[-3:][::-1]

print(f'ROC-AUC Score: {roc_auc:.4f}')
print(f'Top 3 Important Features: {top_features}')
print(f'Feature Importances: {feature_importance[top_features]}')