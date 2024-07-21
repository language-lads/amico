import { Controller } from "@hotwired/stimulus";
import consumer from "../channels/consumer";

const STREAM_CONTEXT_OPTIONS: AudioContextOptions = {
  // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#latencyhint
  latencyHint: "interactive",
};

const STREAM_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    channelCount: {
      exact: 1,
    },
    echoCancellation: {
      ideal: true,
    },
    noiseSuppression: {
      ideal: false,
    },
    autoGainControl: {
      ideal: false,
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

export default class extends Controller {
  static values = { updateAudioPath: String, conversationId: Number };
  declare updateAudioPathValue: string;
  declare conversationIdValue: number;
  declare channel: any;

  connect() {
    // Connect to the conversation websocket channel
    const classThis = this;
    this.channel = consumer.subscriptions.create(
      { channel: "ConversationChannel", id: this.conversationIdValue },
      {
        // When the websocket is ready, start our conversation
        connected() {
          classThis.startConversation.call(classThis);
        },

        disconnected() {
          // Called when the subscription has been terminated by the server
          console.log("disconnected");
        },

        received(data: any) {
          // Called when there's incoming data on the websocket for this channel
          console.log("received", data);
        },
      },
    );
  }

  disconnect() {
    this.stopConversation();
    this.channel.unsubscribe();
  }

  startConversation() {
    this.stopConversation(); // Cleanup any previous conversation
    if (!this.canRecordFromMicrophone()) return;
    this.startMicrophoneStream().catch((error) => {
      console.error("Could not start the microphone", error);
      this.stopConversation();
    });
  }

  async startMicrophoneStream() {
    return navigator.mediaDevices
      .getUserMedia(STREAM_CONSTRAINTS)
      .then(async (stream) => {
        window.audioStream = stream; // Store globally so we can access it / stop it later

        this.assertOnlyOneAudioTrack(stream);
        const audioTrack = stream.getAudioTracks()[0];
        console.debug("Audio track settings: ", audioTrack.getSettings());

        const audioStreamContext = this.createStreamContext();
        console.debug("Created stream context: ", audioStreamContext);

        await this.registerModulesForProcessor(audioStreamContext);

        const resampleNode = new AudioWorkletNode(
          audioStreamContext,
          "resample-to-16kHz",
        );
        // Make sure the resampler knows about our audio track settings (sample rate etc.)
        resampleNode.port.postMessage({
          sampleRate: audioStreamContext.sampleRate,
          channelCount: audioTrack.getSettings().channelCount,
        });
        let order = 0;
        resampleNode.port.onmessage = async (e) => {
          // Send the audio samples to the server
          const data: AudioSamples = e.data;
          this.channel.send({ audio_samples: data, order: order++ });

          //this.channel.send({ audio_samples: data.map((x) => x.value) });
          //await patch(this.updateAudioPathValue, {
          //  body: JSON.stringify({ audio_samples: data.map((x) => x.value) }),
          //});
        };
        const source = audioStreamContext.createMediaStreamSource(stream);
        source.connect(resampleNode);
      });
  }

  canRecordFromMicrophone() {
    if (navigator.mediaDevices && window.MediaRecorder) return true;
    console.error("MediaDevices / MediaRecorder API not supported");
    return false;
  }

  stopConversation() {
    this.closeMicrophoneStream();
    this.closeMicrophoneStreamContext();
  }

  closeMicrophoneStream() {
    if (!window.audioStream) return;
    window.audioStream.getTracks().forEach((track) => track.stop());
    window.audioStream = undefined;
  }

  closeMicrophoneStreamContext() {
    if (!window.audioStreamContext) return;
    window.audioStreamContext.close();
    window.audioStreamContext = undefined;
  }

  assertOnlyOneAudioTrack(stream: MediaStream) {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length != 1) {
      throw new Error(
        `Expected exactly one audio track, got ${audioTracks.length}`,
      );
    }
  }

  createStreamContext() {
    if (!window.audioStreamContext) {
      window.audioStreamContext = new AudioContext(STREAM_CONTEXT_OPTIONS);
    }
    return window.audioStreamContext;
  }

  async registerModulesForProcessor(audioStreamContext: AudioContext) {
    // Resampling library
    // https://github.com/webcast/libsamplerate.js
    await audioStreamContext.audioWorklet.addModule(
      "https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js/dist/libsamplerate.worklet.js",
    );
    await audioStreamContext.audioWorklet.addModule(
      "/worklets/resample-to-16kHz.js",
    );
  }
}

//  startClicked() {
//    this.resetChart();
//    this.isListeningValue = true;
//  }

//  stopClicked() {
//    this.isListeningValue = false;
//  }

//  isListeningValueChanged() {
//    const isListening = this.isListeningValue;
//    this.startButtonTarget.disabled = isListening;
//    this.stopButtonTarget.disabled = !isListening;

//    if (isListening) this.startConversation();
//    else this.stopConversation();
//  }

//  startConversation() {
//    this.stopConversation(); // Cleanup any previous conversation
//    if (!this.canRecordFromMicrophone()) return;
//    this.startChartUpdating();
//    this.startMicrophoneStream().catch((error) => {
//      console.error("Could not start the microphone", error);
//      this.stopConversation();
//    });
//  }

//  stopConversation() {
//    this.closeMicrophoneStream();
//    this.closeMicrophoneStreamContext();
//    this.stopChartUpdating();
//  }

//  canRecordFromMicrophone() {
//    if (navigator.mediaDevices && window.MediaRecorder) {
//      return true;
//    }
//    console.error(
//      "MediaDevices API or MediaRecorder API not supported in this browser",
//    );
//    return false;
//  }

//  closeMicrophoneStream() {
//    if (!window.amicoStream) return;
//    window.amicoStream.getTracks().forEach((track) => track.stop());
//    window.amicoStream = undefined;
//  }

//  closeMicrophoneStreamContext() {
//    if (!window.amicoStreamContext) return;
//    window.amicoStreamContext.close();
//    window.amicoStreamContext = undefined;
//  }

//  createStreamContext() {
//    if (!window.amicoStreamContext) {
//      window.amicoStreamContext = new AudioContext(STREAM_CONTEXT_OPTIONS);
//    }
//  }

//  async startMicrophoneStream() {
//    return navigator.mediaDevices
//      .getUserMedia(STREAM_CONSTRAINTS)
//      .then(async (stream) => {
//        window.amicoStream = stream; // Store globally so we can access it / stop it later

//        this.assertOnlyOneAudioTrack(stream);
//        const audioTrack = stream.getAudioTracks()[0];
//        console.debug("Audio track settings: ", audioTrack.getSettings());

//        this.createStreamContext();
//        console.debug("Created stream context: ", window.amicoStreamContext);

//        await this.registerModulesForProcessor();

//        const resampleNode = new AudioWorkletNode(
//          window.amicoStreamContext,
//          "resample-to-16kHz",
//        );
//        // Make sure the resampler knows about our audio track settings (sample rate etc.)
//        resampleNode.port.postMessage(audioTrack.getSettings());
//        resampleNode.port.onmessage = (e) => {
//          const audioEvent = new CustomEvent("audio", {
//            detail: e.data,
//          });
//          window.dispatchEvent(audioEvent);
//        };
//        const source =
//          window.amicoStreamContext.createMediaStreamSource(stream);
//        source.connect(resampleNode);
//      });
//  }

//  async registerModulesForProcessor() {
//    // Resampling library
//    // https://github.com/webcast/libsamplerate.js
//    await window.amicoStreamContext.audioWorklet.addModule(
//      "https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js/dist/libsamplerate.worklet.js",
//    );
//    await window.amicoStreamContext.audioWorklet.addModule(
//      "/worklets/resample-to-16kHz.js",
//    );
//  }

//  assertOnlyOneAudioTrack(stream) {
//    const audioTracks = stream.getAudioTracks();
//    if (audioTracks.length != 1) {
//      throw new Error(
//        `Expected exactly one audio track, got ${audioTracks.length}`,
//      );
//    }
//  }

//  initialiseChart() {
//    const data = {
//      datasets: [
//        {
//          label: "Voice Probability",
//          showLine: true,
//          data: [],
//          borderColor: "#ff6384",
//          backgroundColor: "rgba(255, 99, 132, 0.2)",
//        },
//        {
//          label: "Audio Samples",
//          showLine: true,
//          data: [],
//          borderColor: "#36a2eb",
//          backgroundColor: "rgba(54, 162, 235, 0.2)",
//        },
//      ],
//    };
//    window.audioSamples = [];
//    window.voiceProbabilities = [];
//    Chart.register(annotationPlugin);
//    window.chart = new Chart(this.chartTarget, {
//      type: "scatter",
//      data: data,
//      options: {
//        animation: false, // Disable all updating animations
//        maintainAspectRatio: false,
//        elements: {
//          point: {
//            pointStyle: false,
//          },
//        },
//        scales: {
//          x: {
//            type: "linear",
//            position: "bottom",
//            display: false,
//            //min: 1719658412,
//            //max: 1719658512
//          },
//          y: {
//            min: -1,
//            max: 1,
//          },
//        },
//        plugins: {
//          annotation: {
//            annotations: {
//              line1: {
//                label: {
//                  content: "Speech threshold",
//                  display: true,
//                  color: "green",
//                  position: "start",
//                  yAdjust: -20,
//                },
//                type: "line",
//                yMin: 0.1, // Speech threshold is 0.1
//                yMax: 0.1,
//                borderColor: "green",
//                borderDash: [5, 10],
//                borderWidth: 2,
//              },
//            },
//          },
//        },
//      },
//    });

//    window.addEventListener("audio", (event) => {
//      const reduction_factor = 16000 / 500;
//      const reduced_audio = event.detail.filter(
//        (_, i) => i % reduction_factor === 0,
//      );
//      const lastTimestamp = event.detail.at(-1).timestamp;
//      window.audioSamples = window.audioSamples
//        .concat(reduced_audio)
//        .filter((x) => x.timestamp > lastTimestamp - CHART_WINDOW);
//    });

//    window.addEventListener("voiceProbability", (event) => {
//      window.voiceProbabilities.push(event.detail);
//      const lastTimestamp = event.detail.timestamp;
//      window.voiceProbabilities = window.voiceProbabilities.filter(
//        (x) => x.timestamp > lastTimestamp - CHART_WINDOW,
//      );
//    });

//    window.addEventListener("userAudioUtterance", ({ detail }) => {
//      let start = detail.at(0).timestamp;
//      let end = detail.at(-1).timestamp;
//      window.chart.options.plugins.annotation.annotations.box1 = {
//        type: "box",
//        xMin: start * 1000,
//        xMax: end * 1000,
//        yMin: -0.1,
//        yMax: 0.1,
//        backgroundColor: "rgb(153, 102, 255, 0.45)",
//      };
//      window.chart.update();
//    });
//  }

//  startChartUpdating() {
//    this.stopChartUpdating();
//    window.updateChartInterval = setInterval(() => {
//      window.chart.data.datasets[1].data = window.audioSamples.map((sample) => {
//        return { x: sample.timestamp * 1000, y: sample.value };
//      });
//      window.chart.data.datasets[0].data = window.voiceProbabilities.map(
//        (probability) => {
//          return { x: probability.timestamp * 1000, y: probability.value };
//        },
//      );

//      // I don't want the X axis to be growing as the data comes in
//      const samples = window.chart.data.datasets[1].data;
//      const samplesLength = window.audioSamples.length;
//      if (samplesLength > 2) {
//        let end = samples[samplesLength - 1].x;
//        let start = end - CHART_WINDOW * 1000; // CHART_WINDOW seconds
//        chart.options.scales.x.min = start;
//        chart.options.scales.x.max = end;
//      }

//      window.chart.update();
//    }, 300);
//  }

//  stopChartUpdating() {
//    clearInterval(window.updateChartInterval);
//  }

//  resetChart() {
//    window.audioSamples = [];
//    window.voiceProbabilities = [];
//    if (!window.chart) return;
//    window.chart.data.datasets[0].data = [];
//    window.chart.data.datasets[1].data = [];
//    window.chart.update();
//  }
//}

//[>* @constant
//    @type {AudioContextOptions}
//*/
//const STREAM_CONTEXT_OPTIONS = {
//  // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#latencyhint
//  latencyHint: "interactive",
//};

//[>* @constant
//    @type {MediaStreamConstraints}
//*/
//const STREAM_CONSTRAINTS = {
//  audio: {
//    channelCount: {
//      exact: 1,
//    },
//    echoCancellation: {
//      ideal: true,
//    },
//    noiseSuppression: {
//      ideal: true,
//    },
//    autoGainControl: {
//      ideal: true,
//    },
//    voiceIsolation: {
//      ideal: true,
//    },
//    sampleRate: {
//      ideal: 16000, // 16kHz
//    },
//    sampleSize: {
//      ideal: 32, // 32 bit floats
//    },
//  },
//  video: false,
//};
