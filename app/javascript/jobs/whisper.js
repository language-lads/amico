export default class Whisper {
  constructor() {
    window.addEventListener(
      "userAudioUtterance",
      /** @type {EventListener} */ (this.handleVoiceActivity),
    );
  }

  /**
   * @param {VoiceProbabilityEvent} event
   */
  handleVoiceActivity({ detail }) {
    console.log("user audio utterance", detail);
  }
}
