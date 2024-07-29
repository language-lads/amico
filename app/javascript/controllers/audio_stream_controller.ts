import { Controller } from "@hotwired/stimulus";
import consumer from "../channels/consumer";

// Connects to data-controller="audio-stream"
export default class extends Controller {
  static values = {
    conversationId: Number,
  };

  declare conversationIdValue: number;
  declare channel: any;
  declare audio: HTMLAudioElement;

  connect() {
    console.log(`Hello audio stream ${this.conversationIdValue}`);

    // Connect to the audio-stream websocket channel
    const classThis = this;
    this.channel = consumer.subscriptions.create(
      { channel: "AudioStreamChannel", id: this.conversationIdValue },
      {
        connected() {
          console.log("Connected to the audio stream channel");
        },

        disconnected() {
          console.log("Disconnected from the audio stream channel");
          classThis.audio.pause();
        },

        received(data: string) {
          if (classThis.audio) {
            classThis.audio.pause();
          }
          classThis.audio = new Audio("data:audio/mp3;base64," + data);
          classThis.audio.play();
        },
      },
    );
  }

  disconnect() {
    if (this.audio) {
      this.audio.pause();
    }
    this.channel.unsubscribe();
  }
}
