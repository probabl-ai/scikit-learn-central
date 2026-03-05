"""
Sentiment classification of customer reviews with skore, skrub and scikit-learn.
"""

import numpy as np
import pandas as pd
from skrub import StringEncoder, ApplyToCols
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from skore import CrossValidationReport

# Let's start by creating a dataset of positive and negative reviews
positive_reviews = [
    "Absolutely loved this product, exceeded all my expectations",
    "Fast shipping and the item was exactly as described",
    "Great quality for the price, would definitely buy again",
    "Customer service was incredibly helpful and responsive",
    "Works perfectly, setup was easy and instructions were clear",
    "Solid build quality, feels premium and durable",
    "Arrived quickly and well packaged, very satisfied",
    "Exactly what I needed, performs as advertised",
    "Outstanding product, my whole family enjoys it",
    "Very impressed with the quality, highly recommend",
    "Brilliant purchase, works even better than expected",
    "Five stars, packaging was secure and delivery was fast",
    "Lovely product, great attention to detail",
    "Exceeded expectations, will order again without hesitation",
    "Perfect gift, recipient was absolutely delighted",
    "Runs quietly and efficiently, really happy with it",
    "Superb craftsmanship, clearly made to last",
    "Pleasantly surprised by the quality at this price point",
    "Easy to assemble, instructions were clear and helpful",
    "Fantastic value, does everything the listing promised",
]

negative_reviews = [
    "Stopped working after just two weeks, very disappointed",
    "Cheap plastic feel, nothing like what was shown in photos",
    "Arrived damaged and customer support was useless",
    "Complete waste of money, broke on first use",
    "Terrible product, does not match the description at all",
    "Sent the wrong item and getting a refund is impossible",
    "Fell apart within days, extremely poor build quality",
    "Would not recommend, packaging was torn and item scratched",
    "Instructions were missing and the product made loud noises",
    "Very disappointing, expected much better for this price",
    "Faulty unit straight out of the box, total waste",
    "Product looks nothing like the photos, very misleading",
    "Customer service ignored my complaint entirely",
    "Broke after a single use, absolutely terrible quality",
    "Flimsy and poorly constructed, regret buying this",
    "Never arrived and tracking showed no updates for weeks",
    "Very hard to assemble and pieces did not fit together",
    "Overpriced for what you get, deeply disappointed",
    "Stopped functioning after first charge, not acceptable",
    "Hugely disappointed, nothing like what was advertised",
]

X = pd.DataFrame({"review": positive_reviews + negative_reviews})
y = np.array(
    ["satisfied"] * len(positive_reviews) + ["dissatisfied"] * len(negative_reviews)
)

# skrub encodes text; sklearn fits a classifier; pipeline chains them
pipe = make_pipeline(
    ApplyToCols(StringEncoder(random_state=42), cols="review"),
    LogisticRegression(),
)

# skore runs cross-validation and exposes metrics + fitted estimator
cv_report = CrossValidationReport(pipe, X, y, pos_label="satisfied")
print(cv_report.metrics.summarize().frame())

# Predict on new text using the estimator fitted on full data
new_samples = pd.DataFrame(
    {
        "review": [
            "Really happy with this product, works great and arrived quickly",
            "It seems okay but nothing special, took a while to arrive",
            "Broke after one day and customer support never replied",
        ]
    }
)
new_samples["sentiment"] = cv_report.estimator_.predict(new_samples[["review"]])

print(new_samples.to_string())
