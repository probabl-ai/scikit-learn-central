import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_percentage_error
from feature_engine.creation import PolynomialFeatures
import optuna
import mlflow

# Synthetic crop data
np.random.seed(42)
n_samples = 400
X = pd.DataFrame({
    'rainfall': np.random.uniform(200, 800, n_samples),
    'temperature': np.random.uniform(15, 35, n_samples),
    'soil_ph': np.random.uniform(5.5, 8.0, n_samples),
    'fertilizer_n': np.random.uniform(50, 300, n_samples),
    'land_area': np.random.uniform(0.5, 10, n_samples)
})

y = (0.5*X['rainfall'] + 20*X['temperature'] - 
     100*(X['soil_ph']-6.5)**2 + 0.3*X['fertilizer_n'] + 
     50*X['land_area'] + np.random.normal(0, 100, n_samples))

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Feature engineering
poly = PolynomialFeatures()
X_train_poly = poly.fit_transform(X_train)
X_test_poly = poly.transform(X_test)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_poly)
X_test_scaled = scaler.transform(X_test_poly)

# Optuna hyperparameter optimization
def objective(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 200),
        'max_depth': trial.suggest_int('max_depth', 3, 10),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3)
    }
    
    model = XGBRegressor(**params, random_state=42)
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    
    return mean_absolute_percentage_error(y_test, y_pred)

study = optuna.create_study()
study.optimize(objective, n_trials=30, show_progress_bar=False)

best_params = study.best_params
model = XGBRegressor(**best_params, random_state=42)

mlflow.start_run()
model.fit(X_train_scaled, y_train)
y_pred = model.predict(X_test_scaled)

r2 = r2_score(y_test, y_pred)
mape = mean_absolute_percentage_error(y_test, y_pred)

mlflow.log_params(best_params)
mlflow.log_metric('r2_score', r2)
mlflow.log_metric('mape', mape)

print(f'R2 Score: {r2:.4f}')
print(f'MAPE: {mape:.4f}')
print(f'Best Parameters: {best_params}')
mlflow.end_run()