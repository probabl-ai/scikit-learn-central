import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler
from lightgbm import LGBMRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error

# Generate 2 years of hourly energy data
start_date = datetime(2022, 1, 1)
date_range = pd.date_range(start=start_date, periods=17520, freq='H')

# Energy demand with daily/weekly seasonality
hours = np.arange(17520)
trend = np.linspace(1000, 1200, 17520)
daily_pattern = 200 * np.sin(2 * np.pi * (hours % 24) / 24)
weekly_pattern = 100 * np.sin(2 * np.pi * (hours % 168) / 168)
noise = np.random.normal(0, 20, 17520)
demand = trend + daily_pattern + weekly_pattern + noise

df = pd.DataFrame({'date': date_range, 'demand': demand})

# Create time-based features
df['hour'] = df['date'].dt.hour
df['dayofweek'] = df['date'].dt.dayofweek
df['month'] = df['date'].dt.month

# Lag features for time series
for lag in [24, 168, 336]:
    df[f'demand_lag_{lag}'] = df['demand'].shift(lag)

df = df.dropna()

# Prepare data
X = df[['hour', 'dayofweek', 'month', 'demand_lag_24', 'demand_lag_168', 'demand_lag_336']].values
y = df['demand'].values

# Time series split
tscv = TimeSeriesSplit(n_splits=5)
models_mae = []

for train_idx, test_idx in tscv.split(X):
    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]
    
    model = LGBMRegressor(random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    models_mae.append(mae)

avg_mae = np.mean(models_mae)
mape = mean_absolute_percentage_error(y, model.predict(X))

print(f'Average MAE: {avg_mae:.2f}')
print(f'MAPE: {mape:.4f}')
print(f'Energy Demand Forecasted')