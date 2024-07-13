import {
  Model,
  DecodingOptionsBuilder,
  default as init,
  Task,
  AvailableModels,
  Quantization,
  Segment,
} from "../ratchet-ml/ratchet-web";
//} from "@ratchet-ml/ratchet-web";

type Language = "en" | "it" | "de";

export default class Whisper {
  private model: Model | undefined;
  private options: any;
  private userAudioUtterancesToProcess: AudioSamples[] = [];
  private isProcessingUserAudioUtterance = false;

  constructor() {
    this.setupWhisper().then(() => {
      window.addEventListener("userAudioUtterance", async (e: Event) => {
        await this.handleUserAudioUtterance.bind(this)(e as AudioEvent);
      });
    });
  }

  setLanguage(language: Language) {
    this.options.language = {
      String: language,
    };
  }

  async setupWhisper() {
    const language = "en";
    const selectedModel: AvailableModels = { Whisper: "tiny" };
    const task = Task.Transcribe;
    const suppress_non_speech = true;
    await init(new URL("wasm/ratchet-web_bg.wasm", window.location.origin));
    this.model = await Model.load(
      selectedModel,
      Quantization.F32,
      (p: number) => console.log(`Loading: ${p}%`),
    );
    let builder = new DecodingOptionsBuilder();
    // TODO: Eventually make a testing harness that can
    // fuzz test these options and see which ones are the most accurate
    this.options = builder
      .setLanguage(language)
      .setTask(task)
      .setSuppressBlank(suppress_non_speech)
      .setTemperature(0)
      .setBeamSize(1)
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
      let result = "";
      await this.model.run({
        audio: Float32Array.from(detail.map((x) => x.value)),
        decode_options: this.options,
        callback: (segment: Segment) => {
          result += segment.text;
        },
      });
      window.dispatchEvent(
        new CustomEvent("userUtterance", { detail: result }),
      );
    }
    this.isProcessingUserAudioUtterance = false;
  }
}
