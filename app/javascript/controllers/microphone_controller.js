import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  connect() {
    console.log("connected");
  }

  start() {
    console.log("microphone start");
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      console.error(
        "MediaDevices API or MediaRecorder API not supported in this browser.",
      ); 
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: false,
      })
      .then(async (stream) => {
        window.amicoStream = stream;
        window.amicoStreamContext = new AudioContext();
        await window.amicoStreamContext.audioWorklet.addModule(
          "audio-processor.js",
        );

        // Step 4: Connect the node
        const sampleNode = new AudioWorkletNode(
          window.amicoStreamContext,
          "audio-sample-processor",
        );
        const source = window.amicoStreamContext.createMediaStreamSource(
          window.amicoStream,
        );
        source.connect(sampleNode);
      })
      .catch((error) => {
        console.error("Could not get user media:", error);
      });
  }

  stop() {
    console.log("microphone stop");
    if (window.amicoStream) {
      window.amicoStream.getTracks().forEach((track) => track.stop());
    }
    if (window.amicoStreamContext) {
      window.amicoStreamContext.close();
      window.amicoStreamContext = null;
    }
  }
}
