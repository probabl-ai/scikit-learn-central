# %% [markdown]
#
# # Credit risk classification for banking with skore, skrub, and scikit-learn.
#
# ## Environment setup
#
# We need to install some extra dependencies for this notebook if needed (when
# running jupyterlite).

# %%
# %pip install skore skrub

# %% [markdown]
#
# ## Data loading
#
# The bundled CSV is based on the **UCI Statlog German Credit Data** benchmark:
# each row is a loan applicant, and the target is **credit risk** (`good` vs
# `bad`), i.e. repayment / creditworthiness—not card or payment *fraud* in the
# narrow sense.
#
# This repository ships a **subset** of the classic attributes only:
# `checking_status`, `credit_amount`, `duration`, `personal_status`,
# `other_payment_plans`, and `target`, so the table stays small and runs
# offline in JupyterLite.
#
# Expect a **compact, complete** tabular dataset with **categorical** and
# **numeric** predictors, and usually **more `good` than `bad`** labels (class
# imbalance). The original UCI task also documents **asymmetric** costs
# (missing a bad risk is worse than over-flagging a good one), so plain accuracy
# is not always enough to judge a model.

# %%
import pandas as pd

german_credit = pd.read_csv(
    "datasets/german_credit.csv",
    dtype={
        "checking_status": "category",
        "personal_status": "category",
        "other_payment_plans": "category",
    },
)
y = german_credit.pop("target")
X = german_credit

# %% [markdown]
#
# Here we use **skrub** and **skore** together. **skrub**'s `tabular_pipeline("classifier")`
# builds a strong default tabular pipeline that handles mixed types without hand-written
# preprocessing. **skore**'s `evaluate` fits that pipeline, evaluates it, and returns a
# report with metrics, checks, and a fitted estimator you can reuse on new rows.
#
# Evaluation uses one shuffled train-test split; `splitter=0.25` reserves 25% of rows
# for testing (see the `skore.evaluate` documentation for other options).

# %%
import skore
import skrub

report = skore.evaluate(
    skrub.tabular_pipeline("classifier"), X, y, splitter=0.25, pos_label="good"
)
report

# %% [markdown]
#
# Looking at the checks summary, we can spot potential issues. Let's inspect them in
# more detail.

# %%
report.checks.summarize()

# %% [markdown]
#
# The checks may flag **overfitting**. Comparing metrics on the training and test sets
# helps confirm whether the model fits the training data much better than it generalizes.

# %%
report.metrics.summarize(data_source="both").frame()

# %% [markdown]
#
# If training scores look much better than test scores, common mitigations include
# fewer boosting iterations, shallower trees, stronger regularization, or a lower
# learning rate (often together with more iterations), depending on the base estimator.
#
# Let's use the fitted pipeline to score hypothetical new applicants.

# %%
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
).infer_objects()

# %%
classes = list(report.estimator_.classes_)
proba = report.estimator_.predict_proba(samples)
samples["p(good)"] = proba[:, classes.index("good")].round(3)
samples
