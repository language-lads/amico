interface Window {
  Stimulus: import("@hotwired/stimulus").Application;
}

/**
 * Represented as decimal seconds since epoch.
 * Accurate to the millisecond.
 */
type Timestamp = number;

type AudioSample = {
  /** Audio sample as a floating point number */
  value: number;
  /** The timestamp of the audio sample */
  timestamp: Timestamp;
};

type AudioSamples = AudioSample[];

interface AudioEvent extends CustomEvent {
  detail: AudioSamples;
}

/** Represents the probability that the speaker is speaking. */
type VoiceProbability = {
  /** Probability value between 0 and 1 */
  value: number;
  timestamp: Timestamp;
};

/** Event emitted on every new available voice probability */
interface VoiceProbabilityEvent extends CustomEvent {
  detail: VoiceProbability;
}
