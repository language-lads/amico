import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  start() {
    if (isAlreadyRecording()) return;
    if (!canRecordFromMicrophone()) return;

    navigator.mediaDevices
      .getUserMedia({
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
        },
        video: false,
      })
      .then(async (stream) => {
        console.debug("Started recording from the microphone");
        window.amicoStream = stream; // Store globally so we can access it / stop it later

        assertOnlyOneAudioTrack(stream);
        const audioTrack = stream.getAudioTracks()[0];
        console.debug("Audio track settings: ", audioTrack.getSettings());

        if (!window.amicoStreamContext) {
          window.amicoStreamContext = new AudioContext({
            // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#latencyhint
            latencyHint: "interactive",
          });
          await window.amicoStreamContext.audioWorklet.addModule(
            "audio-processor.js",
          );
        }
        const sampleNode = new AudioWorkletNode(
          window.amicoStreamContext,
          "audio-sample-processor",
        );
        const source =
          window.amicoStreamContext.createMediaStreamSource(stream);
        source.connect(sampleNode);
      })
      .catch((error) => {
        stop();
        console.error("Could not start the microphone", error);
      });
  }

  stop() {
    console.debug("Stopped recording from the microphone");
    if (window.amicoStream) {
      window.amicoStream.getTracks().forEach((track) => track.stop());
    }
    if (window.amicoStreamContext) {
      window.amicoStreamContext.close();
      window.amicoStreamContext = null;
    }
  }
}

function isAlreadyRecording() {
  if (window.amicoStream && window.amicoStream.active) {
    console.debug("Already recording from the microphone");
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
