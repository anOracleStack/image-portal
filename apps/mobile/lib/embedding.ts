import { EMBED_DIM, EMBED_MODEL, EMBED_VERSION } from "@ip/shared";

// SCAN-time query embedding runs ON-DEVICE (Master Spec 2.3 / Law 3): kills the
// managed-API cold-start on the hot path and keeps the raw frame on the phone.
//
// PLUG POINT: load the SAME pinned model the server embeds catalog images with
// (EMBED_MODEL), exported to ONNX Runtime RN / ExecuTorch / TFLite. Preprocess
// MUST match packages/vision/preprocess exactly (Law 4) — center-crop square,
// grayscale, normalize, 256px — before feeding the model.
//
// Until the native model binary is bundled, this throws loudly. Never return a
// fake/random vector — silent fake recognition is forbidden (.cursorrules).

export interface OnDeviceEmbedder {
  readonly model: string;
  readonly version: number;
  embed(frame: { uri: string }): Promise<Float32Array>;
}

class UnconfiguredEmbedder implements OnDeviceEmbedder {
  readonly model = EMBED_MODEL;
  readonly version = EMBED_VERSION;
  async embed(): Promise<Float32Array> {
    throw new Error(
      `On-device model '${EMBED_MODEL}' not bundled. Add the ONNX/ExecuTorch ` +
        `/TFLite export (dim ${EMBED_DIM}) and matching preprocessing. ` +
        `Do not ship without it — see docs/MANUAL.md TASK 10.`
    );
  }
}

export function getEmbedder(): OnDeviceEmbedder {
  return new UnconfiguredEmbedder();
}
