import argparse
import os

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
import skl2onnx
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=str, default='data/train.csv')
    parser.add_argument('--out', type=str, default='../backend/models/rush.onnx')
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    X = df[['hSin','hCos','dSin','dCos','vHash','cHash','price','outdoor']].values.astype(np.float32)
    y = df['rush'].values.astype(np.float32)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = GradientBoostingRegressor(random_state=42)
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    print('R2:', r2_score(y_test, pred))

    initial_type = [('input', FloatTensorType([None, X.shape[1]]))]
    onx = convert_sklearn(model, initial_types=initial_type)

    out_path = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'wb') as f:
        f.write(onx.SerializeToString())
    print('Saved ONNX to', out_path)


if __name__ == '__main__':
    main()
