import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  toggle() {
    this.element.classList.toggle("is-active");
  }

  close(event: Event) {
		// Close the dropdown if the click was outside of it
    if (this.element.contains(event.target as Node)) return;
    this.element.classList.remove("is-active");
  }
}
