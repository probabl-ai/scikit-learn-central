import numpy as np
from river import anomaly, linear_model, preprocessing, compose
from river.drift import ADWIN
from pyod.models.iforest import IForest
from sklearn.preprocessing import StandardScaler
import pandas as pd

# Simulate streaming transactions
def transaction_generator(n_transactions=2000):
    """Generate synthetic transaction stream."""
    for i in range(n_transactions):
        yield {
            'amount': np.random.exponential(100),
            'merchant_category': np.random.choice(
                ['grocery', 'gas', 'restaurant', 'online', 'casino'],
                p=[0.4, 0.2, 0.2, 0.15, 0.05]
            ),
            'hour': np.random.randint(0, 24),
            'is_international': np.random.binomial(1, 0.1),
            'is_fraud': np.random.binomial(1, 0.01)
        }

# River streaming anomaly detector
model = compose.Pipeline(
    preprocessing.StandardScaler(),
    anomaly.HalfSpaceTrees(random_state=42)
)

# Concept drift detector
adwin = ADWIN(delta=0.002)

# PyOD batch detector for comparison
iforest_batch = IForest(contamination=0.01, random_state=42)

# Streaming detection
detections = 0
total = 0
batch_data = []

for transaction in transaction_generator(2000):
    # Extract features for scoring
    features = {
        'amount': transaction['amount'],
        'hour': transaction['hour'],
        'is_international': transaction['is_international']
    }
    
    # River streaming prediction (1 = anomaly)
    is_anomaly = model.score_one(features)
    
    # Update model
    model.learn_one(features)
    
    # Track drift
    adwin.update(is_anomaly)
    
    # Accumulate batch data
    batch_data.append([
        transaction['amount'],
        transaction['hour'],
        transaction['is_international']
    ])
    
    total += 1
    detections += (is_anomaly > 0.5)

# Batch detection for comparison
if len(batch_data) > 0:
    X_batch = np.array(batch_data)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_batch)
    
    iforest_pred = iforest_batch.fit_predict(X_scaled)
    iforest_detections = (iforest_pred == -1).sum()
    
    print(f'Streaming Detection Rate: {detections/total:.2%}')
    print(f'Batch IForest Detection Rate: {iforest_detections/total:.2%}')
    print(f'Concept Drift Detected: {adwin.detected_change}')
    print(f'Processed {total} transactions in real-time')