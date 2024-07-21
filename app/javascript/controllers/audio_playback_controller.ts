import { Controller } from "@hotwired/stimulus";

// Connects to data-controller="audio-playback"
export default class extends Controller {
  static targets = ["audio", "loading"];

  declare readonly audioTarget: HTMLAudioElement;
  declare readonly loadingTarget: HTMLElement;

  connect() {
    if (this.audioTarget.readyState >= 3) this.loaded();
  }

  loaded() {
    this.loadingTarget.classList.add("is-hidden");
    this.audioTarget.classList.remove("is-hidden");
  }
}
