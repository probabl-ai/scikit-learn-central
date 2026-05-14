import numpy as np
from sklearn.datasets import load_breast_cancer
from sksurv.ensemble import RandomSurvivalForest
from sksurv.metrics import concordance_index_censored
import shap

# Load breast cancer dataset
data = load_breast_cancer()
X = data.data

# Create survival events and times
n_samples = len(X)
T = np.random.exponential(5, n_samples)  # Survival times
E = np.random.binomial(1, 0.3, n_samples)  # Event indicator (death=1, censored=0)

# Structure for scikit-survival
y = np.array([(bool(E[i]), T[i]) for i in range(n_samples)],
             dtype=[('event', bool), ('time', float)])

# Random Survival Forest
rsf = RandomSurvivalForest(
    n_estimators=100,
    max_depth=10,
    random_state=42
)
rsf.fit(X, y)

# Concordance index
score = concordance_index_censored(y['event'], y['time'], rsf.predict(X))[0]

# SHAP explanations
explainer = shap.TreeExplainer(rsf.estimators_[0])
shap_values = explainer.shap_values(X)

feature_importance = np.abs(shap_values).mean(axis=0)
top_features = np.argsort(feature_importance)[-5:][::-1]

print(f'Concordance Index: {score:.4f}')
print(f'Top Risk Factors:')
for i in top_features:
    print(f'  Feature {i}: {feature_importance[i]:.4f}')
print('Model trained for survival prediction')