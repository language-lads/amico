//import * as ort from "onnxruntime-web";

//export default class VoiceActivityDetection {
//  constructor() {
    /**
     * @public
     * @type {VoiceProbabilities}
     */
//    this.voiceProbabilities = [];

    /**
     * @public
     * @type {AudioSamples}
     */
//    this.audioSamples = [];

//    // We need a bunch of WASM files to run the ONNX model, just use their CDN
//    ort.env.wasm.wasmPaths =
//      "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/";

//    // WASM session to run the ONNX model
//    ort.InferenceSession.create("/models/silero_vad.onnx").then((session) => {
//      this.session = session;
//    });

//    // Listen for audio events from the microphone
//    window.addEventListener(
//      "audio",
//      async (e) => await this.handleAudio([>* @type {AudioEvent} <] (e)),
//    );
//  }

  /**
   * @param {AudioEvent} event
   */
//  async handleAudio({ detail }) {
//    const audioSamples = detail;
//    if (!this.session) {
//      console.error("ONNX session not ready");
//      return;
//    }
//    const audio_array = Float32Array.from(audioSamples.map((x) => x.value));
//    const sample_rate = BigInt(16000);
//    const inputs = {
//      input: new ort.Tensor("float32", audio_array, [1, audio_array.length]),
//      sr: new ort.Tensor("int64", new BigInt64Array([sample_rate]), [1]),
//      h: new ort.Tensor("float32", new Float32Array(128).fill(0), [2, 1, 64]),
//      c: new ort.Tensor("float32", new Float32Array(128).fill(0), [2, 1, 64]),
//    };

//    const results = await this.session.run(inputs);
//    const vad_probability = (await results.output.getData())[0];
//    if (typeof vad_probability !== "number") {
//      console.error("Invalid VAD probability", vad_probability);
//      return;
//    }

//    const newVoiceProbability = {
//      value: vad_probability,
//      timestamp: Date.now() / 1000,
//    };

//    //this.voiceProbabilities.push(newVoiceProbability);

//    [>* @type {VoiceProbabilityEvent} <]
//    const voiceActivityEvent = new CustomEvent("voiceProbability", {
//      detail: newVoiceProbability,
//    });
//    window.dispatchEvent(voiceActivityEvent);
//  }
//}
