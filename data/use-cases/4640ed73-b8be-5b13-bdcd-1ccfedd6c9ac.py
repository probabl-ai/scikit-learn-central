import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score
from mlxtend.classifier import StackingCVClassifier

# Hardcoded training reviews
reviews = [
    'Great product, highly satisfied!', 'Terrible quality and broke fast',
    'Excellent service and fast shipping', 'Worst purchase ever',
    'Amazing value for money', 'Poor customer support experience',
    'Very happy with my order', 'Defective item received',
    'Best buy I have made', 'Disappointed with the product'
] * 2  # Replicate for more samples

y = np.array([1, 0, 1, 0, 1, 0, 1, 0, 1, 0] * 2)

# Base classifiers
tfidf_svc = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=100)),
    ('svc', LinearSVC(random_state=42))
])

tfidf_nb = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=100)),
    ('nb', MultinomialNB())
])

# Stacking classifier
stacking = StackingCVClassifier(
    classifiers=[tfidf_svc, tfidf_nb],
    meta_classifier=LinearSVC(random_state=42),
    cv=3
)

# Cross-validation
scores = cross_val_score(stacking, reviews, y, cv=5, scoring='accuracy')

print(f'CV Accuracy: {scores.mean():.4f} (+/- {scores.std():.4f})')

# Predict on new reviews
stacking.fit(reviews, y)
new_reviews = [
    'Wonderful experience!',
    'Not happy with this',
    'Perfect quality'
]
preds = stacking.predict(new_reviews)
for review, pred in zip(new_reviews, preds):
    sentiment = 'Positive' if pred == 1 else 'Negative'
    print(f'{review} -> {sentiment}')