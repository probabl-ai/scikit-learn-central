import pandas as pd
import numpy as np
from sklearn.model_selection import cross_validate
from sklearn.pipeline import Pipeline
from lightgbm import LGBMClassifier
from skrub import TableVectorizer
import shap

# Generate synthetic telecom customer data
np.random.seed(42)
n_samples = 1000
X = pd.DataFrame({
    'plan_type': np.random.choice(['basic', 'premium', 'family'], n_samples),
    'payment_method': np.random.choice(['credit', 'bank', 'check'], n_samples),
    'tenure': np.random.randint(1, 60, n_samples),
    'monthly_charges': np.random.uniform(20, 120, n_samples),
    'total_charges': np.random.uniform(100, 5000, n_samples)
})
y = np.random.binomial(1, 0.2, n_samples)  # 20% churn rate

# Build pipeline with skrub TableVectorizer
pipeline = Pipeline([
    ('vectorizer', TableVectorizer()),
    ('lgb', LGBMClassifier(random_state=42))
])

# Cross-validation
scores = cross_validate(
    pipeline, X, y,
    cv=5,
    scoring=['accuracy', 'roc_auc', 'f1']
)

print(f'CV ROC-AUC: {scores["test_roc_auc"].mean():.4f}')
print(f'CV F1-Score: {scores["test_f1"].mean():.4f}')

# Train and explain
pipeline.fit(X, y)
explainer = shap.TreeExplainer(
    pipeline.named_steps['lgb']
)
shap_values = explainer.shap_values(X)
print(f'Mean |SHAP| values: {np.abs(shap_values).mean(axis=0)}')