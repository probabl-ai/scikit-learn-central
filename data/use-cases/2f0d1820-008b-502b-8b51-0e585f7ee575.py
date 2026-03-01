import numpy as np
import pandas as pd
from sklearn.model_selection import cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from feature_engine.encoding import WoEEncoder
from feature_engine.imputation import MeanMedianImputer
from interpret.glassbox import ExplainableBoostingClassifier
import optuna

# Generate synthetic credit data
np.random.seed(42)
n_samples = 500
X = pd.DataFrame({
    'age': np.random.randint(18, 80, n_samples),
    'income': np.random.randint(20000, 200000, n_samples),
    'debt_ratio': np.random.uniform(0, 1, n_samples),
    'num_accounts': np.random.randint(0, 10, n_samples),
    'missed_payments': np.random.randint(0, 5, n_samples)
})
y = (X['missed_payments'] > 0).astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# Pipeline with feature engineering
pipeline = Pipeline([
    ('imputer', MeanMedianImputer()),
    ('scaler', StandardScaler()),
    ('ebm', ExplainableBoostingClassifier(random_state=42))
])

# Train and evaluate
pipeline.fit(X_train, y_train)
from sklearn.metrics import mean_squared_error
y_pred = pipeline.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print(f'RMSE: {rmse:.4f}')
print('Feature Importances:')
for i, col in enumerate(X.columns):
    print(f'  {col}: {pipeline.named_steps["ebm"].feature_importances_[i]:.4f}')