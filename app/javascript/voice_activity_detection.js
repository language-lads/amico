import * as ort from "onnxruntime-web";

export default class VoiceActivityDetection {
  constructor() {
    ort.env.wasm.wasmPaths =
      "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/";

    ort.InferenceSession.create("models/silero_vad.onnx").then((session) => {
      this.session = session;
    });

    window.addEventListener("audio", async (e) => await this.handleAudio(e));
  }

  async handleAudio(audioEvent) {
    if (!this.session) return;
    const audio_array = Float32Array.from(
      audioEvent.detail.map((x) => x.value),
    );
    const sample_rate = BigInt(16000);
    const inputs = {
      input: new ort.Tensor("float32", audio_array, [1, audio_array.length]),
      sr: new ort.Tensor("int64", new BigInt64Array([sample_rate]), [1]),
      h: new ort.Tensor("float32", new Float32Array(128), [2, 1, 64]),
      c: new ort.Tensor("float32", new Float32Array(128), [2, 1, 64]),
    };

    // feed inputs and run
    const results = await this.session.run(inputs);
    const vad_probability = (await results.output.getData())[0];

    const voiceActivityEvent = new CustomEvent("voiceActivityProbability", {
      detail: {
        value: vad_probability,
        timestamp: Date.now() / 1000,
      },
    });
    window.dispatchEvent(voiceActivityEvent);
  }
}
