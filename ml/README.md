# QuickCourt ML Pipeline (Rush/Price)

This folder contains a minimal pipeline to train a rushScore regression model and export it to ONNX for backend inference.

## Overview
- Data: weakly-labeled synthetic dataset bootstrapped from current backend heuristics + temporal features.
- Model: GradientBoostingRegressor (sklearn) exported via skl2onnx to `backend/models/rush.onnx`.
- Backend: set `USE_ML_MODEL=true` and `MODEL_PATH=backend/models/rush.onnx` to enable ONNX inference.

## Setup
1) Install Python 3.9+ and create a venv.
2) Install requirements:
   pip install -r requirements.txt

## Generate training data
This produces `data/train.csv` with features and labels.

   python fetch_data.py --rows 50000 --out data/train.csv

## Train and export ONNX
This trains a baseline model and writes `backend/models/rush.onnx`.

   python train.py --data data/train.csv --out ../backend/models/rush.onnx

## Enable backend ML
Set environment variables and restart backend:

- USE_ML_MODEL=true
- MODEL_PATH=backend/models/rush.onnx

If you want GPU/CPU-optimized ONNX runtime, install on the Node side:

  npm i onnxruntime-node

The backend will fall back to heuristic predictions if the model or runtime is not available.

## Notes
- This baseline uses weak labels from heuristics. Replace `fetch_data.py` to ingest real bookings + external signals (weather, holidays, events) for better accuracy.
- Feature mapping is simple and aligned with `buildFeatures()` in `backend/src/routes/ml.ts`.
