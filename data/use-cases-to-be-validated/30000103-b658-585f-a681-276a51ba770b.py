import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from category_encoders import TargetEncoder
import eli5
import shap

# Synthetic HR data
np.random.seed(42)
n_employees = 300
X = pd.DataFrame({
    'department': np.random.choice(['IT', 'Sales', 'HR', 'Finance'], n_employees),
    'satisfaction': np.random.uniform(1, 5, n_employees),
    'salary_band': np.random.choice(['A', 'B', 'C', 'D'], n_employees),
    'years_employed': np.random.randint(0, 20, n_employees)
})
y = ((X['satisfaction'] < 2.5) | (X['years_employed'] < 2)).astype(int)

# Pipeline with TargetEncoder
pipeline = Pipeline([
    ('encoder', TargetEncoder()),
    ('scaler', StandardScaler()),
    ('rf', RandomForestClassifier(n_estimators=50, random_state=42))
])

pipeline.fit(X, y)

# ELI5 feature weights
rf = pipeline.named_steps['rf']
weights = eli5.show_weights(
    rf,
    feature_names=X.columns.tolist(),
    top=10
)

# Predict one employee and explain
test_employee = X.iloc[0:1]
prediction = pipeline.predict(test_employee)
risk_score = pipeline.predict_proba(test_employee)[0, 1]

print(f'Employee Attrition Risk: {risk_score:.2%}')
print('Top Risk Factors:')
for i in np.argsort(rf.feature_importances_)[-5:][::-1]:
    print(f'  {X.columns[i]}: {rf.feature_importances_[i]:.4f}')