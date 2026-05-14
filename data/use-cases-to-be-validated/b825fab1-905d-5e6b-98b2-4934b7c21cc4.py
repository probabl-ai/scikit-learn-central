import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
import umap
import prince

# Synthetic user-product rating matrix
np.random.seed(42)
n_users, n_products = 50, 20
ratings = np.random.randint(1, 6, (n_users, n_products))
for i in range(n_users):
    for j in range(n_products):
        if np.random.rand() > 0.7:
            ratings[i, j] = 0  # Missing ratings

ratings_df = pd.DataFrame(ratings)

# Matrix factorization using TruncatedSVD
svd = TruncatedSVD(n_components=5, random_state=42)
latent_factors = svd.fit_transform(ratings_df.fillna(0))

# Item-item similarity
item_similarity = cosine_similarity(latent_factors.T)

# Get top 5 recommendations for user 0
user_0_ratings = ratings_df.iloc[0]
unrated_items = user_0_ratings[user_0_ratings == 0].index

rec_scores = {}
for unrated_item in unrated_items:
    score = 0
    for rated_item in user_0_ratings[user_0_ratings > 0].index:
        score += user_0_ratings[rated_item] * item_similarity[
            rated_item, unrated_item
        ]
    rec_scores[unrated_item] = score

top_5_recs = sorted(
    rec_scores.items(),
    key=lambda x: x[1],
    reverse=True
)[:5]

# UMAP projection for visualization
reducer = umap.UMAP(n_components=2, random_state=42)
product_embedding = reducer.fit_transform(latent_factors.T)

# MCA for categorical analysis
mca = prince.MCA(n_components=2, random_state=42)
categories = pd.DataFrame({
    'product_type': np.random.choice(
        ['Electronics', 'Books', 'Clothing'],
        n_products
    )
})
mca.fit(categories)

print(f'Top 5 Recommendations for User 0:')
for item_id, score in top_5_recs:
    print(f'  Product {item_id}: Score {score:.2f}')
print(f'SVD Latent Dimensions: {latent_factors.shape}')