import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static values = { isActive: Boolean };
  static targets = ["startButton", "stopButton"];

  start() {
    if (this.isActiveValue) return;
    this.isActiveValue = true;
    if (isAlreadyRecording()) return;
    if (!canRecordFromMicrophone()) return;
    startMicrophoneStream();
    console.debug("Started conversation");
  }

  stop() {
    if (!this.isActiveValue) return;
    this.isActiveValue = false;
    closeMicrophoneStream();
    closeMicrophoneStreamContext();
    stopConversationWorker();
    console.debug("Stopped conversation");
  }

  isActiveValueChanged() {
    this.startButtonTarget.disabled = this.isActiveValue;
    this.stopButtonTarget.disabled = !this.isActiveValue;
  }
}

/** @constant
    @type {MediaStreamConstraints}
*/
const STREAM_CONSTRAINTS = {
  audio: {
    channelCount: {
      exact: 1,
    },
    echoCancellation: {
      ideal: true,
    },
    noiseSuppression: {
      ideal: true,
    },
    autoGainControl: {
      ideal: true,
    },
    voiceIsolation: {
      ideal: true,
    },
    sampleRate: {
      ideal: 16000, // 16kHz
    },
    sampleSize: {
      ideal: 32, // 32 bit floats
    },
  },
  video: false,
};

/** @constant
    @type {AudioContextOptions}
*/
const STREAM_CONTEXT_OPTIONS = {
  // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#latencyhint
  latencyHint: "interactive",
};

function startMicrophoneStream() {
  navigator.mediaDevices
    .getUserMedia(STREAM_CONSTRAINTS)
    .then(async (stream) => {
      window.amicoStream = stream; // Store globally so we can access it / stop it later

      assertOnlyOneAudioTrack(stream);
      const audioTrack = stream.getAudioTracks()[0];
      console.debug("Audio track settings: ", audioTrack.getSettings());

      createStreamContext();
      console.debug("Created stream context: ", window.amicoStreamContext);

      await registerModulesForProcessor();
      startConversationWorker();

      const resampleNode = new AudioWorkletNode(
        window.amicoStreamContext,
        "resample-to-16kHz",
      );
      // Make sure the resampler knows about our audio track settings (sample rate etc.)
      resampleNode.port.postMessage(audioTrack.getSettings());
      resampleNode.port.onmessage = (e) => {
        // Send all our resampled audio data to the conversation worker
        if (!window.conversationWorker) return;
        window.conversationWorker.postMessage(e.data);
      };
      const source = window.amicoStreamContext.createMediaStreamSource(stream);
      source.connect(resampleNode);
    })
    .catch((error) => {
      stop();
      console.error("Could not start the microphone", error);
    });
}

function startConversationWorker() {
  if (window.conversationWorker) return;
  window.conversationWorker = new Worker("workers/conversation.js");
}

function stopConversationWorker() {
  if (!window.conversationWorker) return;
  window.conversationWorker.terminate();
  window.conversationWorker = undefined;
}

function closeMicrophoneStream() {
  if (!window.amicoStream) return;
  window.amicoStream.getTracks().forEach((track) => track.stop());
  window.amicoStream = undefined;
}

function closeMicrophoneStreamContext() {
  if (!window.amicoStreamContext) return;
  window.amicoStreamContext.close();
  window.amicoStreamContext = undefined;
}

function isAlreadyRecording() {
  if (window.amicoStream && window.amicoStream.active) {
    console.debug("Conversation already started");
    return true;
  }
  return false;
}

function canRecordFromMicrophone() {
  if (navigator.mediaDevices && window.MediaRecorder) {
    return true;
  }
  console.error(
    "MediaDevices API or MediaRecorder API not supported in this browser",
  );
  return false;
}

async function registerModulesForProcessor() {
  // Resampling library
  // https://github.com/webcast/libsamplerate.js
  await window.amicoStreamContext.audioWorklet.addModule(
    "https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js/dist/libsamplerate.worklet.js",
  );
  await window.amicoStreamContext.audioWorklet.addModule(
    "resample-to-16kHz.js",
  );
  await window.amicoStreamContext.audioWorklet.addModule("vad.js");
}

/**
 * I don't know why there would be more than one audio track...
 *
 * @param {MediaStream} stream
 * @throws {Error}
 */
function assertOnlyOneAudioTrack(stream) {
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length != 1) {
    throw new Error(
      `Expected exactly one audio track, got ${audioTracks.length}`,
    );
  }
}

function createStreamContext() {
  if (!window.amicoStreamContext) {
    window.amicoStreamContext = new AudioContext(STREAM_CONTEXT_OPTIONS);
  }
}
