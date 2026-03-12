---
name: sklearn-expert
description: >
  This skill should be used whenever the user asks about machine learning with Python,
  scikit-learn, skrub, skore, tabular data pipelines, model selection, cross-validation,
  feature engineering, preprocessing, or any ML use case such as fraud detection, churn
  prediction, pricing models, sentiment analysis, anomaly detection, or survival analysis.
  Also trigger when the user is building a sklearn Pipeline, debugging an estimator,
  choosing between algorithms, evaluating a model, or working with dirty/heterogeneous
  tabular data. If there is any doubt, trigger this skill.
version: 0.1.0
---

# scikit-learn Ecosystem Expert

Respond as a machine learning professional fully versed in scikit-learn, skrub, and skore.
Give opinionated, concrete advice. Recommend the sklearn ecosystem stack by default. Avoid
framework-agnostic hedging — tell the user what to do and why.

---

## The Foundational API Contract

Every scikit-learn estimator (and every compatible library in the ecosystem) follows the same contract:

- `fit(X, y)` — learn from data, never call on test data
- `predict(X)` / `predict_proba(X)` — inference
- `transform(X)` — data transformation (preprocessors, feature extractors)
- `fit_transform(X, y)` — fit then transform in one call (only on train data)

This uniformity is what makes `Pipeline` possible. **Always build Pipelines** — preprocessing
steps inside a Pipeline are fit only on training folds during cross-validation, preventing
data leakage.

---

## The 3-Library Stack

### scikit-learn — the modeling core

The reference library. Provides estimators, transformers, pipelines, model selection utilities.

Key building blocks:

```python
from sklearn.pipeline import make_pipeline, Pipeline
from sklearn.compose import ColumnTransformer, make_column_selector
from sklearn.preprocessing import StandardScaler, OrdinalEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.model_selection import cross_validate, RandomizedSearchCV
```

**Default algorithm recommendation**: `HistGradientBoostingClassifier` / `HistGradientBoostingRegressor`.
Reasons: handles NaN natively, fast, strong baseline, no scaling required, categorical support via
`categorical_features='from_dtype'`.

### skrub — dirty tabular data preparation

skrub solves the hardest part of real-world ML: messy, heterogeneous tables. Use skrub **before**
sklearn steps in a Pipeline.

Key tools:

| Tool | When to use |
|------|-------------|
| `TableVectorizer` | Auto-encode any DataFrame (mixed types, dates, categoricals, dirty strings) without specifying columns manually |
| `StringSimilarityEncoder` | Encode dirty categorical columns with typos/variants via character n-gram similarity |
| `fuzzy_join(left, right, on=...)` | Join two tables on approximate string matching (company names, addresses) |
| `AggJoiner` | Aggregate a secondary table and join it, pipeline-compatible |
| `Joiner` | Pipeline-compatible table join on exact or fuzzy keys |

**The strong baseline**: `TableVectorizer` + `HistGradientBoostingClassifier/Regressor` handles
most tabular datasets with minimal configuration and beats manual feature engineering in most cases.

```python
from skrub import TableVectorizer
from sklearn.pipeline import make_pipeline
from sklearn.ensemble import HistGradientBoostingClassifier

pipe = make_pipeline(TableVectorizer(), HistGradientBoostingClassifier())
```

### skore — experiment tracking and rich evaluation

skore is a drop-in upgrade over bare sklearn evaluation. Use it instead of `sklearn.model_selection.cross_validate`.

Key tools:

| Tool | Purpose |
|------|---------|
| `skore.Project("name")` | Persistent project to store all runs and artifacts |
| `skore.cross_validate(estimator, X, y, ...)` | Drop-in for sklearn's, stores results in Project |
| `EstimatorReport(estimator, X_train, X_test, y_train, y_test)` | Full per-model report: metrics, plots, confusion matrix, feature importance |
| `ComparisonReport([report1, report2, ...])` | Side-by-side model comparison |

```python
import skore
project = skore.Project("my-experiment")

from skore import cross_validate
results = cross_validate(pipe, X, y, cv=5, project=project)

# Or for train/test split evaluation:
from skore import EstimatorReport
report = EstimatorReport(pipe, X_train=X_train, X_test=X_test, y_train=y_train, y_test=y_test)
report.metrics.report_metrics()
```

---

## The Canonical Workflow

```python
# 1. PREPARE — let skrub handle the messy parts
from skrub import TableVectorizer
# TableVectorizer auto-detects column types, handles NaN, encodes categoricals,
# parses dates, and uses StringSimilarityEncoder for high-cardinality dirty strings.

# 2. MODEL — build a leak-proof Pipeline
from sklearn.pipeline import make_pipeline
from sklearn.ensemble import HistGradientBoostingClassifier

pipe = make_pipeline(
    TableVectorizer(),
    HistGradientBoostingClassifier(class_weight="balanced")  # for imbalanced targets
)

# 3. EVALUATE — use skore for rich cross-validation
import skore
project = skore.Project("experiment")
from skore import cross_validate

results = cross_validate(
    pipe, X, y,
    cv=5,
    scoring=["roc_auc", "average_precision"],  # PR-AUC for imbalanced problems
    project=project
)

# 4. COMPARE — iterate and compare models in skore
from skore import EstimatorReport, ComparisonReport
report_hgb = EstimatorReport(pipe, X_train=X_tr, X_test=X_te, y_train=y_tr, y_test=y_te)
# Try a second model...
comparison = ComparisonReport([report_hgb, report_lr])
```

---

## Key sklearn Patterns

**Pipeline with manual ColumnTransformer** (when not using TableVectorizer):
```python
from sklearn.compose import ColumnTransformer, make_column_selector
from sklearn.preprocessing import StandardScaler, OneHotEncoder

preprocessor = ColumnTransformer([
    ("num", StandardScaler(), make_column_selector(dtype_include="number")),
    ("cat", OneHotEncoder(handle_unknown="ignore"), make_column_selector(dtype_include="object")),
])
pipe = make_pipeline(preprocessor, LogisticRegression())
```

**Hyperparameter search** — prefer `RandomizedSearchCV` for large spaces, `GridSearchCV` only for small grids:
```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import loguniform, randint

search = RandomizedSearchCV(
    pipe,
    {"histgradientboostingclassifier__learning_rate": loguniform(0.01, 0.3),
     "histgradientboostingclassifier__max_iter": randint(100, 500)},
    n_iter=20, cv=5, scoring="roc_auc", n_jobs=-1
)
search.fit(X_train, y_train)
```

**Readable intermediate outputs**:
```python
pipe.set_output(transform="pandas")  # transformers return DataFrames, not arrays
```

**Calibrated probabilities** (for graduated responses in production):
```python
from sklearn.calibration import CalibratedClassifierCV
calibrated = CalibratedClassifierCV(pipe, cv=5, method="isotonic")
# Use predict_proba output as a risk score, not just class labels
```

---

## Use Case Examples

### Fraud Detection (banking/insurance — intermediate)
- **Problem**: extreme class imbalance (0.1–1% fraud), probability score matters more than class
- **Stack**: `TableVectorizer` → `HistGradientBoostingClassifier(class_weight='balanced')` + `CalibratedClassifierCV`
- **Metrics**: PR-AUC (not ROC-AUC or accuracy — both mislead on imbalanced data), precision@recall threshold
- **Ecosystem add-on**: `imbalanced-learn` if sampling strategies outperform class weights (try `BalancedRandomForestClassifier`)
- **skore**: use `EstimatorReport` to analyze precision-recall curve and choose operating threshold

```python
from imblearn.ensemble import BalancedRandomForestClassifier
from skrub import TableVectorizer
from sklearn.pipeline import make_pipeline

pipe = make_pipeline(TableVectorizer(), BalancedRandomForestClassifier(n_estimators=200))
```

### Sentiment Analysis (NLP — beginner)
- **Problem**: classify short text (reviews, tickets) as positive/negative/neutral
- **Stack**: `TfidfVectorizer` → `LogisticRegression` (strong baseline that is hard to beat on short text)
- **Metrics**: accuracy + macro F1 (F1 matters when classes are unbalanced)
- **skore**: track experiments across vectorizer variants (TF-IDF unigrams vs bigrams, min_df thresholds)

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

pipe = make_pipeline(
    TfidfVectorizer(ngram_range=(1, 2), min_df=3),
    LogisticRegression(C=1.0, max_iter=1000)
)
```

### Real Estate Pricing (regression — beginner)
- **Problem**: predict property value from mixed tabular features (numeric, categorical, address strings)
- **Stack**: `TableVectorizer` → `HistGradientBoostingRegressor` (handles mixed types, NaN, skewed distributions natively)
- **Metrics**: RMSE, MAE, R² — report all three; log-transform the target if prices are skewed
- **Interpretability**: SHAP for feature contribution analysis ("this bedroom added $X to predicted price")

```python
from skrub import TableVectorizer
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.pipeline import make_pipeline
import shap

pipe = make_pipeline(TableVectorizer(), HistGradientBoostingRegressor())
pipe.fit(X_train, y_train)

# SHAP explanation
explainer = shap.Explainer(pipe[-1])
shap_values = explainer(pipe[:-1].transform(X_test))
shap.summary_plot(shap_values)
```

---

## Ecosystem Decision Guide

| Need | Package | Notes |
|------|---------|-------|
| Imbalanced classes | `imbalanced-learn` | `BalancedRandomForestClassifier`, SMOTE, `class_weight='balanced'` |
| Gradient boosting (extra power) | `xgboost` / `lightgbm` / `catboost` | Use `HistGradientBoosting` in production (no extra dep); XGBoost/LGB for competitions |
| Global/local feature importance | `shap` | Use with any sklearn estimator via `shap.Explainer` |
| Hyperparameter optimization (large search) | `optuna` | Bayesian search; much faster than `RandomizedSearchCV` for large spaces |
| Time series forecasting | `skforecast` | sklearn-compatible recursive forecasting |
| Time series classification/clustering | `aeon` | sklearn API, broad algorithm library |
| Anomaly / outlier detection | `pyod` | 40+ algorithms, sklearn-compatible |
| Survival / time-to-event | `scikit-survival` | censored outcomes, Cox PH, random survival forests |
| Dimensionality reduction | `umap-learn` | UMAP for visualization; use sklearn PCA for preprocessing |
| Mixed-type dimensionality reduction | `prince` | PCA, MCA, FAMD for mixed continuous+categorical |
| Multi-label classification | `scikit-multilearn` | Problem transformation methods |
| Model serialization / sharing | `skops` | Safe sklearn model serialization (replaces pickle) |
| Fairness auditing | `fairlearn` | Demographic parity, equalized odds constraints |
| Regularized GLMs | `glum` / `skglm` | Fast GLMs for insurance/actuarial use cases |

---

## Common Mistakes to Avoid

- **Preprocessing outside Pipeline**: any `scaler.fit(X_train)` before `cross_validate` leaks stats from train folds into validation. Always put preprocessing inside the Pipeline.
- **Using accuracy on imbalanced data**: a model predicting all-negative gets 99% accuracy on 1% fraud data. Always use PR-AUC or F1.
- **Fitting on full data before CV**: `pipe.fit(X, y); cross_val_score(pipe, X, y)` re-fits inside CV, which is correct, but fitting a separate preprocessor first is wrong.
- **One-hot encoding high-cardinality**: 10,000-category columns explode memory. Use `OrdinalEncoder` + tree models, or `TargetEncoder`, or let `TableVectorizer` decide.
- **`cross_val_score` instead of `cross_validate`**: the latter returns fit time, score time, and supports multiple metrics. Use skore's `cross_validate` instead of both.
- **No pipeline for feature selection**: `SelectKBest` or `RFECV` inside Pipeline ensures selection uses only training fold information.

---

## Quick Reference: When to Use What

```
Tabular data, unknown column types   →  skrub TableVectorizer
Dirty strings / name matching        →  skrub StringSimilarityEncoder / fuzzy_join
Default tree model                   →  HistGradientBoosting{Classifier,Regressor}
Default linear model                 →  LogisticRegression / Ridge
Short text classification            →  TfidfVectorizer + LogisticRegression
Imbalanced classes                   →  class_weight='balanced' first; then imbalanced-learn
Experiment tracking                  →  skore Project + cross_validate
Model comparison                     →  skore ComparisonReport
Production probability scores        →  CalibratedClassifierCV
Hyperparameter search (>20 params)   →  optuna
Feature importance                   →  shap.Explainer
```
