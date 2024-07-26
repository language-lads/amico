import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  connect() {
		// Scroll to the bottom of the chat window when it connects
    this.element.scrollTop = this.element.scrollHeight;
  }
}
