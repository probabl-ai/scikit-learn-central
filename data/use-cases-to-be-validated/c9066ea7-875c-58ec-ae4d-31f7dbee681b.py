import numpy as np
import pandas as pd
from sklearn.datasets import load_diabetes
from sklearn.model_selection import cross_validate
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from skrub import TableVectorizer
import shap

# Load diabetes dataset and convert to binary classification
diabetes = load_diabetes()
X = pd.DataFrame(diabetes.data, columns=diabetes.feature_names)
y = (diabetes.target > diabetes.target.median()).astype(int)

# Build pipeline
pipeline = Pipeline([
    ('vectorizer', TableVectorizer()),
    ('gb', GradientBoostingClassifier(random_state=42))
])

# Cross-validation with multiple metrics
scores = cross_validate(
    pipeline, X, y, cv=5,
    scoring=['accuracy', 'roc_auc', 'f1']
)

print(f'ROC-AUC: {scores["test_roc_auc"].mean():.4f}')
print(f'F1-Score: {scores["test_f1"].mean():.4f}')

# Train for explanations
pipeline.fit(X, y)
gb = pipeline.named_steps['gb']

# SHAP analysis
explainer = shap.TreeExplainer(gb)
shap_values = explainer.shap_values(X)

# Feature importances
feature_importance = np.abs(shap_values[1]).mean(axis=0)
for i, col in enumerate(X.columns):
    print(f'{col}: {feature_importance[i]:.4f}')

print('Top Risk Factors Identified')