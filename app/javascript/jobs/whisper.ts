import {
  Model,
  DecodingOptionsBuilder,
  default as init,
  Task,
  AvailableModels,
  Quantization,
  Segment,
} from "@ratchet-ml/ratchet-web";
import wasm from "@ratchet-ml/ratchet-web/ratchet-web_bg.wasm";

export default class Whisper {
  private model: Model | undefined;
  private options: any;
  private userAudioUtterancesToProcess: AudioSamples[] = [];
  private isProcessingUserAudioUtterance = false;

  constructor() {
    this.setupWhisper().then(() => {
      window.addEventListener("userAudioUtterance", async (e: Event) => {
        await this.handleUserAudioUtterance.bind(this)(e);
      });
    });
  }

  async setupWhisper() {
    const language = "it";
    const selectedModel: AvailableModels = { Whisper: "tiny" };
    const task = Task.Transcribe;
    const suppress_non_speech = true;

    await init(wasm);
    this.model = await Model.load(
      selectedModel,
      Quantization.Q8_0,
      (p: number) => console.log(`Loading: ${p}%`),
    );
    let builder = new DecodingOptionsBuilder();
    this.options = builder
      .setLanguage(language)
      .setTask(task)
      .setSuppressBlank(suppress_non_speech)
      .build();
    console.log("Options: ", this.options);
  }

  async handleUserAudioUtterance({ detail }: AudioEvent) {
    this.userAudioUtterancesToProcess.push(detail);
    this.processNextUserAudioUtterance();
  }

  async processNextUserAudioUtterance() {
    if (!this.model) return;

    // We're already processing an audio utterance, so just return
    if (this.isProcessingUserAudioUtterance) return;

    this.isProcessingUserAudioUtterance = true;
    while (this.userAudioUtterancesToProcess.length > 0) {
      const detail = this.userAudioUtterancesToProcess.shift();
      if (!detail) continue;
      await this.model.run({
        audio: Float32Array.from(detail.map((x) => x.value)),
        decode_options: this.options,
        callback: (segment: Segment) => {
          console.log("User:", segment);
        },
      });
    }
    this.isProcessingUserAudioUtterance = false;
  }
}
