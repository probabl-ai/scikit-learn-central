"""
Credit risk (good/bad) classification for banking with skore and scikit-learn.
"""

import pandas as pd
from sklearn.datasets import fetch_openml
from sklearn.ensemble import HistGradientBoostingClassifier
from skore import train_test_split, EstimatorReport

# German Credit (UCI): subset of features for predicting good/bad credit
german_credit = fetch_openml(data_id=31, as_frame=True, parser="pandas")
X, y = german_credit.data, german_credit.target
features_of_interest = [
    "checking_status",
    "credit_amount",
    "duration",
    "personal_status",
    "other_payment_plans",
]
X = X[features_of_interest]

# Split data
split_data = train_test_split(
    X=X, y=y, test_size=0.2, random_state=42, as_dict=True
)

# Fit the estimator and create a report with skore
report = EstimatorReport(
    HistGradientBoostingClassifier(categorical_features="from_dtype", random_state=42),
    pos_label="bad",
    **split_data,
)

# Report the metrics of the estimator
print("\n\nSummary of the metrics:")
print(report.metrics.summarize().frame().to_string())

# Inspect which features drive predictions effortlessly
# using permutation importance on test set
feature_importance = report.inspection.permutation_importance().frame()
print("\n\nPermutation importance on test set:")
print(feature_importance.to_string())

# Score new applicants with the fitted estimator
samples = pd.DataFrame(
    [
        {
            "checking_status": "no checking",
            "credit_amount": 2_000,
            "duration": 12,
            "personal_status": "male single",
            "other_payment_plans": "none",
        },
        {
            "checking_status": "<0",
            "credit_amount": 14_000,
            "duration": 60,
            "personal_status": "male single",
            "other_payment_plans": "bank",
        },
    ]
)
samples["p(fraud)"] = report.estimator_.predict_proba(samples)[:, 1].round(3)
print("\n\nNew applicants:")
print(samples.to_string())
