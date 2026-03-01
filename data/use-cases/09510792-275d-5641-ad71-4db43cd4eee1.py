import numpy as np
from sklearn.datasets import make_classification
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score
from pyod.models.iforest import IForest
from pyod.models.lof import LOF
import umap

# Generate imbalanced network traffic data
X, y = make_classification(
    n_samples=2000,
    n_features=20,
    n_informative=15,
    n_redundant=5,
    weights=[0.95, 0.05],
    random_state=42
)

# Normalize
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Ensemble of anomaly detectors
iforest = IForest(random_state=42, contamination=0.05)
lof = LOF(contamination=0.05)

# Predictions (1 = anomaly, 0 = normal)
iforest_pred = iforest.fit_predict(X_scaled)
lof_pred = lof.fit_predict(X_scaled)

# Ensemble vote
ensemble_pred = (iforest_pred + lof_pred) // 2

# Metrics
precision = precision_score(y, ensemble_pred)
recall = recall_score(y, ensemble_pred)

# UMAP projection for visualization
reducer = umap.UMAP(n_components=2, random_state=42)
X_umap = reducer.fit_transform(X_scaled)

print(f'Precision: {precision:.4f}')
print(f'Recall: {recall:.4f}')
print(f'Anomalies Detected: {ensemble_pred.sum()}')
print(f'Detection Rate: {(ensemble_pred == y).mean():.4f}')