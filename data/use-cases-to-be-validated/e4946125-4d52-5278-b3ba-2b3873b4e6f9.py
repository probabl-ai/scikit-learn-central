import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor
from sklearn.model_selection import train_test_split
import optuna
import shap

# Synthetic pricing data
np.random.seed(42)
n_products = 500
X = pd.DataFrame({
    'price': np.random.uniform(10, 100, n_products),
    'competitor_price': np.random.uniform(10, 100, n_products),
    'day_of_week': np.random.randint(0, 7, n_products),
    'category': np.random.randint(0, 5, n_products)
})
# Demand decreases with higher price, increases with lower competitor price
y = 100 - 1.5 * X['price'] + 0.8 * X['competitor_price'] + np.random.normal(0, 5, n_products)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train demand prediction model
model = LGBMRegressor(random_state=42)
model.fit(X_train, y_train)

# Optuna optimization for maximum revenue
def objective(trial):
    test_price = trial.suggest_float('price', 10, 100)
    test_row = pd.DataFrame({
        'price': [test_price],
        'competitor_price': [X_test['competitor_price'].mean()],
        'day_of_week': [X_test['day_of_week'].mode()[0]],
        'category': [X_test['category'].mode()[0]]
    })
    predicted_demand = model.predict(test_row)[0]
    revenue = test_price * max(0, predicted_demand)
    return -revenue  # Minimize negative revenue

study = optuna.create_study()
study.optimize(objective, n_trials=50, show_progress_bar=False)

optimal_price = study.best_params['price']
max_revenue = -study.best_value

print(f'Optimal Price: ${optimal_price:.2f}')
print(f'Expected Revenue: ${max_revenue:.2f}')

# SHAP for price elasticity
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)
print(f'Price Elasticity (avg SHAP): {np.abs(shap_values[:, 0]).mean():.4f}')