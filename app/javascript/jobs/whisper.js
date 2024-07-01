export default class Whisper {
  constructor() {
    window.addEventListener(
      "voiceActivityProbability",
      async (e) => await this.handleAudio(e),
    );
  }

  async handleAudio(audioEvent) {
    console.log("audioEvent: ", audioEvent);
  }
}
