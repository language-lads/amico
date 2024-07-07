/**
 * This job calculates "user audio utterances" and broadcast them
 * to the rest of the application.
 *
 * 1. Listens for audio data from the microphone
 * 2. Listens for voice probability data from the Voice Activity Detection job
 * 3. Buffers audio data and voice probability data
 * 4. Runs an algorithm to break up the audio data into user utterances
 */
export default class AudioChunking {
  constructor() {
    /** @type {VoiceProbabilities} */
    this.voiceProbabilities = [];
    this.voiceProbabilitiesMaxLength = (16000 / 4096) * 15; // Roughly 15 seconds of audio (16kHz samples)

    /** @type {AudioSamples} */
    this.audioSamples = [];
    this.audioSamplesMaxLength = 16000 * 15; // Roughly 15 seconds of audio (16kHz samples)

    this.voiceThreshold = 0.1; // Voice probability values higher than this are considered "speech"
    this.silenceThreshold = 0.1; // How many seconds of silence to wait before considering an utterance finished

    /** @type {number | null} */
    this.previousPauseTimestamp = null; // Records the timestamp of the last pause in speech

    window.addEventListener(
      "audio",
      /** @type {EventListener} */ (this.handleAudio.bind(this)),
    );

    window.addEventListener(
      "voiceProbability",
      /** @type {EventListener} */ (this.handleVoiceProbability.bind(this)),
    );
  }

  /** @param {VoiceProbabilityEvent} event */
  handleVoiceProbability({ detail }) {
    this.voiceProbabilities.push(detail);
    this.voiceProbabilities = this.voiceProbabilities.slice(
      -this.voiceProbabilitiesMaxLength,
    );
    this.runChunkingAlgorithm();
  }

  /** @param {AudioEvent} event */
  handleAudio({ detail }) {
    this.audioSamples = this.audioSamples.concat(detail);
    this.audioSamples = this.audioSamples.slice(-this.audioSamplesMaxLength);
  }

  runChunkingAlgorithm() {
    if (this.voiceProbabilities.length === 0) return;

    let earliestVoiceTimestamp = this.voiceProbabilities[0].timestamp;
    let latestVoiceTimestamp = this.voiceProbabilities.slice(-1)[0].timestamp;

    // If we've only got less than 2 seconds of data, don't look for an utterance
    if (latestVoiceTimestamp - earliestVoiceTimestamp < 2) return;

    // Check if we've gotten past our silence threshold, and therefore have
    // some audio to chunk and broadcast.
    for (let i = this.voiceProbabilities.length - 1; i >= 0; i--) {
      // Look at most recent probabilities first
      let p = this.voiceProbabilities[i];

      let isUnderVoiceThreshold = p.value < this.voiceThreshold;
      let isWithinSilenceThreshold =
        p.timestamp >= latestVoiceTimestamp - this.silenceThreshold;

      // OK, still within our silence bounds, keep checking...
      if (isUnderVoiceThreshold && isWithinSilenceThreshold) continue;

      // Sucesss! We've satisfied our silence limit and found no speech, so we can move onto chunking
      if (isUnderVoiceThreshold && !isWithinSilenceThreshold) break;

      // Uh oh, there's speech in our silence bounds, let's exit and wait for more audio data
      if (!isUnderVoiceThreshold) return;
    }

    // Wait a minute... has it just been silent since the last pause though?
    let previousPauseTimestamp =
      this.previousPauseTimestamp ?? earliestVoiceTimestamp;
    for (let i = this.voiceProbabilities.length - 1; i >= 0; i--) {
      let p = this.voiceProbabilities[i];

      let isUnderVoiceThreshold = p.value < this.voiceThreshold;
      let isPartOfPreviousPause = p.timestamp > previousPauseTimestamp;

      // Still silence, nothing to see here, keep looking...
      if (isUnderVoiceThreshold && isPartOfPreviousPause) continue;

      // Ok we've found the end of the previous pause, but there's still no speech.
      // Let's exit and wait for more audio data
      if (isUnderVoiceThreshold && !isPartOfPreviousPause) return;

      // Alright cool, we have some voice audio to chunk!
      if (!isUnderVoiceThreshold) break;
    }

    // Ok let's broadcast the audio chunk data
    const chunkStart = previousPauseTimestamp;
    const chunkEnd = latestVoiceTimestamp;
    // TODO: This probably needs some performance improvements
    const chunk = this.audioSamples.filter(
      (sample) =>
        sample.timestamp >= chunkStart && sample.timestamp <= chunkEnd,
    );
		this.previousPauseTimestamp = chunkEnd;
    window.dispatchEvent(
      new CustomEvent("userAudioUtterance", { detail: chunk }),
    );
  }
}
