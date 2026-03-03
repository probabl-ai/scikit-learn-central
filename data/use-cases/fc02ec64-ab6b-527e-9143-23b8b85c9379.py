import numpy as np
import pandas as pd
from sklearn.datasets import fetch_openml
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    average_precision_score,
    roc_auc_score,
    classification_report,
)
from sklearn.inspection import permutation_importance

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
y = (y == "bad").astype(int)

cat_cols = ["checking_status", "personal_status", "other_payment_plans"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

clf = HistGradientBoostingClassifier(categorical_features="from_dtype", random_state=42)
clf.fit(X_train, y_train)

y_proba = clf.predict_proba(X_test)[:, 1]
print(f"ROC-AUC:           {roc_auc_score(y_test, y_proba):.4f}")
print(f"Average Precision: {average_precision_score(y_test, y_proba):.4f}")
print()
print(
    classification_report(
        y_test, clf.predict(X_test), target_names=["Good", "Bad"], digits=3
    )
)

perm = permutation_importance(
    clf,
    X_test,
    y_test,
    scoring="average_precision",
    n_repeats=20,
    random_state=42,
    n_jobs=-1,
)
imp_df = pd.DataFrame(
    {"importance_mean": perm.importances_mean, "importance_std": perm.importances_std},
    index=X.columns,
).sort_values("importance_mean", ascending=False)
print("\nPermutation importance:")
for feat, row in imp_df.iterrows():
    print(f"  {row['importance_mean']:+.3f} ± {row['importance_std']:.3f}")

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
samples[cat_cols] = samples[cat_cols].astype("category")
samples["p(fraud)"] = clf.predict_proba(samples)[:, 1].round(3)
print("\nTest samples:")
print(samples.to_string())
