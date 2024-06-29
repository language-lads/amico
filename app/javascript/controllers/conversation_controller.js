import { Controller } from "@hotwired/stimulus";

const MAX_SAMPLES = 5000;

export default class extends Controller {
  // TODO: Make sure to limit the size of the audio samples array
  static values = { isListening: Boolean };
  static targets = ["startButton", "stopButton", "chart"];

  connect() {
    this.initialiseChart();
  }

  startClicked() {
    this.resetChart();
    this.isListeningValue = true;
  }

  stopClicked() {
    this.isListeningValue = false;
  }

  isListeningValueChanged() {
    const isListening = this.isListeningValue;
    this.startButtonTarget.disabled = isListening;
    this.stopButtonTarget.disabled = !isListening;

    if (isListening) this.startConversation();
    else this.stopConversation();
  }

  startConversation() {
    this.stopConversation(); // Cleanup any previous conversation
    if (!this.canRecordFromMicrophone()) return;
    this.startChartUpdating();
    this.startMicrophoneStream().catch((error) => {
      console.error("Could not start the microphone", error);
      this.stopConversation();
    });
  }

  stopConversation() {
    this.closeMicrophoneStream();
    this.closeMicrophoneStreamContext();
    this.stopConversationWorker();
    this.stopChartUpdating();
  }

  canRecordFromMicrophone() {
    if (navigator.mediaDevices && window.MediaRecorder) {
      return true;
    }
    console.error(
      "MediaDevices API or MediaRecorder API not supported in this browser",
    );
    return false;
  }

  closeMicrophoneStream() {
    if (!window.amicoStream) return;
    window.amicoStream.getTracks().forEach((track) => track.stop());
    window.amicoStream = undefined;
  }

  closeMicrophoneStreamContext() {
    if (!window.amicoStreamContext) return;
    window.amicoStreamContext.close();
    window.amicoStreamContext = undefined;
  }

  startConversationWorker() {
    if (window.conversationWorker) return;
    window.conversationWorker = new Worker("workers/conversation.js");
  }

  stopConversationWorker() {
    if (!window.conversationWorker) return;
    window.conversationWorker.terminate();
    window.conversationWorker = undefined;
  }

  createStreamContext() {
    if (!window.amicoStreamContext) {
      window.amicoStreamContext = new AudioContext(STREAM_CONTEXT_OPTIONS);
    }
  }

  async startMicrophoneStream() {
    return navigator.mediaDevices
      .getUserMedia(STREAM_CONSTRAINTS)
      .then(async (stream) => {
        window.amicoStream = stream; // Store globally so we can access it / stop it later

        this.assertOnlyOneAudioTrack(stream);
        const audioTrack = stream.getAudioTracks()[0];
        console.debug("Audio track settings: ", audioTrack.getSettings());

        this.createStreamContext();
        console.debug("Created stream context: ", window.amicoStreamContext);

        await this.registerModulesForProcessor();
        this.startConversationWorker();

        const resampleNode = new AudioWorkletNode(
          window.amicoStreamContext,
          "resample-to-16kHz",
        );
        // Make sure the resampler knows about our audio track settings (sample rate etc.)
        resampleNode.port.postMessage(audioTrack.getSettings());
        resampleNode.port.onmessage = (e) => {
          if (!window.conversationWorker) return;
          window.conversationWorker.postMessage(e.data);
        };
        window.conversationWorker.onmessage = (e) => {
          this.handleWorkerMessage(e.data);
        };
        const source =
          window.amicoStreamContext.createMediaStreamSource(stream);
        source.connect(resampleNode);
      });
  }

  /**
   * Messages received from the background worker
   *
   * @param {[TODO:type]} message - [TODO:description]
   */
  handleWorkerMessage(message) {
    if (message.type === "audio") {
      // Add the audio data to our chart
      window.audioSamples = window.audioSamples
        .concat(message.data)
        .slice(-MAX_SAMPLES);
    }
  }

  async registerModulesForProcessor() {
    // Resampling library
    // https://github.com/webcast/libsamplerate.js
    await window.amicoStreamContext.audioWorklet.addModule(
      "https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js/dist/libsamplerate.worklet.js",
    );
    await window.amicoStreamContext.audioWorklet.addModule(
      "resample-to-16kHz.js",
    );
  }

  assertOnlyOneAudioTrack(stream) {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length != 1) {
      throw new Error(
        `Expected exactly one audio track, got ${audioTracks.length}`,
      );
    }
  }

  initialiseChart() {
    const data = {
      datasets: [
        {
          label: "Voice Probability",
          showLine: true,
          data: [],
          borderColor: "#ff6384",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
        },
        {
          label: "Audio Samples",
          showLine: true,
          data: [],
          borderColor: "#36a2eb",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
        },
      ],
    };
    window.audioSamples = [];
    window.chart = new Chart(this.chartTarget, {
      type: "scatter",
      data: data,
      options: {
        animation: false, // Disable all updating animations
        maintainAspectRatio: false,
        elements: {
          point: {
            pointStyle: false,
          },
        },
        scales: {
          x: {
            type: "linear",
            position: "bottom",
            display: false,
          },
          y: {
            min: -1,
            max: 1,
          },
        },
        plugins: {
          annotation: {
            annotations: {},
          },
        },
      },
    });
  }

  startChartUpdating() {
    this.stopChartUpdating();
    window.updateChartInterval = setInterval(() => {
      window.chart.data.datasets[1].data = window.audioSamples.map(
        (sample, index) => {
          return { x: index, y: sample };
        },
      );
      window.chart.update();
    }, 300);
  }

  stopChartUpdating() {
    clearInterval(window.updateChartInterval);
  }

  resetChart() {
    window.audioSamples = [];
    if (!window.chart) return;
    window.chart.data.datasets[0].data = [];
    window.chart.data.datasets[1].data = [];
    window.chart.update();
  }
}

/** @constant
		@type {AudioContextOptions}
*/
const STREAM_CONTEXT_OPTIONS = {
  // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#latencyhint
  latencyHint: "interactive",
};

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