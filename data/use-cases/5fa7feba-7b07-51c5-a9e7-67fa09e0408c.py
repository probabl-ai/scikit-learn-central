import matplotlib.pyplot as plt
import numpy as np
from sklearn.datasets import fetch_california_housing
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
from sklearn.tree import DecisionTreeRegressor
from skrub import TableVectorizer  # for effortless tabular learning
from skrub import TableReport  # for interactive data exploration
from skore import EstimatorReport, ComparisonReport  # to track your data science

X, y = fetch_california_housing(return_X_y=True, as_frame=True)

# Use TableReport to explore dataframe interactively
# see https://skrub-data.org/stable/reference/generated/skrub.TableReport.html
housing_table_report = TableReport(X)

with plt.ioff():  # hot fix to avoid opening .png
    housing_table_report.open()  # localhost webpage with an interactive table

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create a Pipeline with the TableVectorizer
# TableVectorizer will transform a dataframe to a numeric (vectorized) representation
# see https://skrub-data.org/stable/reference/generated/skrub.TableVectorizer.html
# We use a simple decision tree as a scikit-learn baseline
print("\nDecision Tree model\n")
pipeline = Pipeline(
    [
        ("vectorizer", TableVectorizer()),
        ("decision tree", DecisionTreeRegressor(random_state=42)),
    ]
)

# Good old fit-predict scikit-learn pipeline
pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)

# One can inspect the fitted model the old way
# Compute some metrics...
r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
print("Compute some metrics")
print(f"r2 Score: {r2:.4f}")
print(f"RMSE score: {rmse * 100000:.0f}")
print("\n")

# One can also leverage the skore library to inspect the model and create a structured report
estimator_report = EstimatorReport(pipeline, X_test=X_test, y_test=y_test)
metrics_summary = estimator_report.metrics.summarize().frame()
print("Use skore to create a structured report")
print(metrics_summary)
print("\n\n")

# For more information, you can check insights that are available
print("Learn more about skore metrics with the helper function")
estimator_report.help()
# and learn even more at
# https://docs.skore.probabl.ai/0.13/reference/api/skore.EstimatorReport.html#estimatorreport


# Let's do it again with another model!
print("\nLet's do everything again with a linear regression model!")
linear_pipeline = Pipeline(
    [("vectorizer", TableVectorizer()), ("linear regression", LinearRegression())]
)
linear_pipeline.fit(X_train, y_train)
y_pred = linear_pipeline.predict(X_test)
r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
print("Compute some metrics")
print(f"r2 Score: {r2:.4f}")
print(f"RMSE score: {rmse * 100000:.0f}")
print("\n")
print("Use skore to create a structured report")
linear_estimator_report = EstimatorReport(linear_pipeline, X_test=X_test, y_test=y_test)
metrics_summary = linear_estimator_report.metrics.summarize().frame()
print(metrics_summary)
print("\n\n")

# One can compare scores by hand or crafting some comparison functions...
# ... or one can leverage the ComparisonReport from the skore library
# see https://docs.skore.probabl.ai/0.13/reference/api/skore.ComparisonReport.html#skore.ComparisonReport
print("\nCompare models with the ComparisonReport\n")
comparison_report = ComparisonReport([estimator_report, linear_estimator_report])
print(comparison_report.metrics.summarize().frame())
# If you are curious about automating even more your comparison pipeline, check
# https://docs.skore.probabl.ai/0.13/reference/api/skore.CrossValidationReport.html#crossvalidationreport
