import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_percentage_error
import mlflow

# Generate 2 years of daily sales data
start_date = datetime(2022, 1, 1)
date_range = pd.date_range(start=start_date, periods=730, freq='D')
trend = np.linspace(100, 200, 730)
seasonality = 50 * np.sin(np.arange(730) * 2 * np.pi / 365)
noise = np.random.normal(0, 10, 730)
sales = trend + seasonality + noise

df = pd.DataFrame({'date': date_range, 'sales': sales})

# Create lag features
df['lag_7'] = df['sales'].shift(7)
df['lag_14'] = df['sales'].shift(14)
df['lag_28'] = df['sales'].shift(28)
df['rolling_mean_7'] = df['sales'].rolling(7).mean()
df = df.dropna()

# Split into train/test
train_size = int(0.8 * len(df))
X_train = df.iloc[:train_size, 1:].values
y_train = df.iloc[:train_size, 0].values
X_test = df.iloc[train_size:, 1:].values
y_test = df.iloc[train_size:, 0].values

# Model
model = LGBMRegressor(random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

# Metrics
mape = mean_absolute_percentage_error(y_test, y_pred)

print(f'MAPE: {mape:.4f}')
print(f'Sample Predictions vs Actual:')
for i in range(5):
    print(f'  Pred: {y_pred[i]:.2f}, Actual: {y_test[i]:.2f}')