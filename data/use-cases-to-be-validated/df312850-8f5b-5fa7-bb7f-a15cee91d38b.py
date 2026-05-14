import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import umap
from yellowbrick.cluster import KElbowVisualizer

# Generate synthetic RFM data
np.random.seed(42)
n_customers = 500
X = pd.DataFrame({
    'recency': np.random.uniform(0, 365, n_customers),
    'frequency': np.random.exponential(5, n_customers),
    'monetary': np.random.lognormal(5, 1, n_customers)
})

# Normalize features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Find optimal number of clusters using elbow method
visualizer = KElbowVisualizer(
    KMeans(random_state=42),
    k=(2, 10)
)
visualizer.fit(X_scaled)
optimal_k = visualizer.elbow_value_

# Fit KMeans with optimal clusters
kmeans = KMeans(n_clusters=optimal_k, random_state=42)
clusters = kmeans.fit_predict(X_scaled)

# Evaluate clustering
sil_score = silhouette_score(X_scaled, clusters)

# UMAP 2D visualization
umap_reducer = umap.UMAP(n_components=2, random_state=42)
X_umap = umap_reducer.fit_transform(X_scaled)

# Print segment profiles
for i in range(optimal_k):
    mask = clusters == i
    print(f'Segment {i}: {mask.sum()} customers')
    print(f'  Avg Recency: {X.loc[mask, "recency"].mean():.2f}')
    print(f'  Avg Frequency: {X.loc[mask, "frequency"].mean():.2f}')
    print(f'  Avg Monetary: {X.loc[mask, "monetary"].mean():.2f}')

print(f'Silhouette Score: {sil_score:.4f}')