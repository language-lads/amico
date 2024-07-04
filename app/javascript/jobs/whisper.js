export default class Whisper {
  constructor() {
    window.addEventListener(
      "voiceProbability",
      /** @type {EventListener} */ (this.handleVoiceActivity),
    );
  }

  /**
   * @param {VoiceProbabilityEvent} event
   */
  handleVoiceActivity({ detail }) {
    //console.log("voice activity: ", detail);
  }
}
