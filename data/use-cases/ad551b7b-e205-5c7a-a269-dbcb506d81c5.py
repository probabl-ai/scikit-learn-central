import numpy as np
import pandas as pd
from sklearn.model_selection import cross_validate, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, confusion_matrix, classification_report
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE
from catboost import CatBoostClassifier
import mlflow
import mlflow.sklearn

# Synthetic loan data with 15% default rate
np.random.seed(42)
n_loans = 1000
X = pd.DataFrame({
    'loan_amount': np.random.uniform(5000, 500000, n_loans),
    'interest_rate': np.random.uniform(3, 15, n_loans),
    'term_months': np.random.choice([36, 60, 84], n_loans),
    'annual_income': np.random.uniform(20000, 200000, n_loans),
    'dti_ratio': np.random.uniform(0.1, 0.6, n_loans),
    'fico_score': np.random.normal(700, 50, n_loans)
})

y = np.random.binomial(1, 0.15, n_loans)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)

# Pipeline with SMOTE and CatBoost
pipeline = ImbPipeline([
    ('scaler', StandardScaler()),
    ('smote', SMOTE(random_state=42)),
    ('catboost', CatBoostClassifier(verbose=0, random_state=42))
])

mlflow.set_experiment('loan_default_prediction')
with mlflow.start_run():
    # Cross-validation metrics
    scores = cross_validate(
        pipeline, X_train, y_train, cv=5,
        scoring=['roc_auc', 'precision', 'recall', 'f1']
    )
    
    # Train on full training set
    pipeline.fit(X_train, y_train)
    y_pred_proba = pipeline.predict_proba(X_test)[:, 1]
    y_pred = pipeline.predict(X_test)
    
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    cm = confusion_matrix(y_test, y_pred)
    
    # Log metrics
    mlflow.log_metric('roc_auc', roc_auc)
    mlflow.log_metric('cv_roc_auc', scores['test_roc_auc'].mean())
    mlflow.log_metric('cv_precision', scores['test_precision'].mean())
    mlflow.sklearn.log_model(pipeline, 'model')

print(f'ROC-AUC Score: {roc_auc:.4f}')
print(f'Confusion Matrix:\n{cm}')
print(f'CV Metrics - Precision: {scores["test_precision"].mean():.4f}, Recall: {scores["test_recall"].mean():.4f}')