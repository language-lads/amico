import { Controller } from "@hotwired/stimulus";
import { patch } from "@rails/request.js";

export default class extends Controller {
  async changeLanguage(event: Event) {
    const language = (event.target as HTMLSelectElement).value;
    await patch("/home/change_language", {
      body: JSON.stringify({ language }),
    });
  }
}
