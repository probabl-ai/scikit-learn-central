# %% [markdown]
#
# # Median house value regression with skore, skrub, and scikit-learn.
#
# ## Environment setup
#
# We need to install some extra dependencies for this notebook if needed (when
# running jupyterlite).

# %%
# %pip install skore skrub ipywidgets

# %% [markdown]
#
# ## Data loading
#
# The bundled CSV is the **California housing** dataset (block-level aggregates from
# the 1990 U.S. census, as distributed with scikit-learn). Each row describes a
# California district; the target **`MedHouseVal`** is the median house value in that
# block, in **hundreds of thousands of dollars**.
#
# Features are numeric summaries (income, age, rooms, population, location, etc.).
# The file is vendored under `datasets/` so this notebook runs offline in JupyterLite.

# %%
import pandas as pd

housing = pd.read_csv("datasets/california_housing.csv")
y = housing.pop("MedHouseVal")
X = housing

# %% [markdown]
#
# A classic experiment is to contrast a **random forest** (ensemble of trees) with a
# **Ridge** (L2-regularized linear) model on the same table: both need sensible
# preprocessing for mixed columns, then you compare how well each explains median value.
#
# **`skore.evaluate`** can take a **dict of named estimators** and a **`splitter`**
# integer to run **cross-validation** for every entry. That yields one
# **comparison report** (metrics and checks aggregated across models and folds)
# instead of hand-written split loops or separate `ComparisonReport` wiring.
#
# Below, each pipeline is **`skrub.tabular_pipeline(...)`** around a scikit-learn
# regressor so encoding and imputation stay consistent between the two approaches.

# %%
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge

import skore
import skrub

cv_report = skore.evaluate(
    {
        "forest": skrub.tabular_pipeline(RandomForestRegressor(random_state=42)),
        "ridge": skrub.tabular_pipeline(Ridge()),
    },
    X,
    y,
    splitter=5,
)
cv_report

# %% [markdown]
#
# The comparison report runs the same diagnostic **checks** on every cross-validated
# model. Summarize them to see issues such as over- or underfitting flagged per
# estimator.

# %%
cv_report.checks.summarize()

# %% [markdown]
#
# **Metrics** are aggregated across folds and models so you can rank approaches (for
# example RMSE or R²) without writing your own aggregation code.

# %%
cv_report.metrics.summarize().frame()

# %% [markdown]
#
# We see that the random forest is performing better but at the cost of a longer
# training time.
