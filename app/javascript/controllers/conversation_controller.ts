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
  static values = {
    updateAudioPath: String,
    conversationId: Number,
    status: String,
  };
  declare updateAudioPathValue: string;
  declare conversationIdValue: number;
  declare statusValue: string;
  declare channel: any;

  connect() {
    // Don't start if the conversation is already completed
    if (this.statusValue == "completed") return;

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
    if (this.statusValue == "completed") return;

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
