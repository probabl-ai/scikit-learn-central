import numpy as np
from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
from mlxtend.classifier import StackingCVClassifier
import eli5

# Fetch 4 document categories
categories = ['sci.med', 'sci.space', 'talk.politics.guns', 'comp.graphics']
train = fetch_20newsgroups(
    subset='train',
    categories=categories,
    remove=('headers', 'footers'),
    random_state=42
)
test = fetch_20newsgroups(
    subset='test',
    categories=categories,
    remove=('headers', 'footers'),
    random_state=42
)

# Base classifiers with TF-IDF
tfidf_svc = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=5000)),
    ('svc', LinearSVC(random_state=42, max_iter=2000))
])

tfidf_nb = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=5000)),
    ('nb', MultinomialNB())
])

# Stacking ensemble
stacking = StackingCVClassifier(
    classifiers=[tfidf_svc, tfidf_nb],
    meta_classifier=LinearSVC(random_state=42, max_iter=2000),
    cv=3
)

stacking.fit(train.data, train.target)
y_pred = stacking.predict(test.data)

accuracy = accuracy_score(test.target, y_pred)

print(f'Classification Accuracy: {accuracy:.4f}')
print('\nClassification Report:')
print(classification_report(
    test.target, y_pred,
    target_names=categories
))
print('Document routing model ready')