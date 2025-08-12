/*
 Optional ONNX model loader for rush prediction.
 If USE_ML_MODEL=true and MODEL_PATH points to a valid .onnx, we will run inference.
 Falls back gracefully if onnxruntime-node is not installed or model not found.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */
let ort: any | null = null;
try {
  // Lazy require to avoid hard dependency
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ort = require('onnxruntime-node');
} catch {
  ort = null;
}

let session: any | null = null;
let inputName: string | null = null;
let outputName: string | null = null;

export type MLInput = {
  // batch of feature vectors (Float32Array or number[])
  features: Float32Array[];
};

export async function ensureModelLoaded(modelPath: string): Promise<boolean> {
  if (!ort) return false;
  if (session) return true;
  try {
    session = await ort.InferenceSession.create(modelPath);
    // assume single input and single output, resolve dynamically and safely
    if (Array.isArray(session.inputNames) && session.inputNames.length > 0) {
      const nm = session.inputNames[0];
      inputName = typeof nm === 'string' ? nm : String(nm ?? 'input');
    } else if (session.inputMetadata && typeof session.inputMetadata === 'object') {
      const keys = Object.keys(session.inputMetadata);
      inputName = keys.length && keys[0] ? String(keys[0]) : 'input';
    } else {
      inputName = 'input';
    }
    if (Array.isArray(session.outputNames) && session.outputNames.length > 0) {
      const nm = session.outputNames[0];
      outputName = typeof nm === 'string' ? nm : String(nm ?? '');
      if (!outputName) outputName = null;
    } else if (session.outputMetadata && typeof session.outputMetadata === 'object') {
      const keys = Object.keys(session.outputMetadata);
      outputName = keys.length && keys[0] ? String(keys[0]) : null;
    } else {
      outputName = null;
    }
    return true;
  } catch {
    session = null;
    inputName = null;
    outputName = null;
    return false;
  }
}

export async function predictBatch(features: Float32Array[]): Promise<number[] | null> {
  if (!ort || !session || !inputName) return null;
  if (!features.length) return [];
  const rows = features.length;
  const first = features[0];
  const cols = first ? first.length : 0;
  if (cols <= 0) return [];
  const data = new Float32Array(rows * cols);
  for (let r = 0; r < rows; r++) {
    const vec = features[r] ?? new Float32Array(cols);
    data.set(vec, r * cols);
  }
  const tensor = new ort.Tensor('float32', data, [rows, cols]);
  const feeds: any = { [inputName as string]: tensor };
  const out = await session.run(feeds);
  // choose a safe output name
  const outName = outputName || Object.keys(out)[0];
  const outTensor = outName ? out[outName] : undefined;
  const arr: Float32Array | number[] = (outTensor && outTensor.data ? outTensor.data : undefined) ?? new Float32Array(rows);
  // squeeze to 1D
  const result: number[] = [];
  const step = Math.floor((arr.length) / rows) || 1;
  for (let r = 0; r < rows; r++) {
    const v = Number(arr[r * step]);
    result.push(isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5);
  }
  return result;
}
