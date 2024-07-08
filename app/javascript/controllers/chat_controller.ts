import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["messageList"];

  declare readonly hasMessageListTarget: boolean;
  declare readonly messageListTarget: HTMLElement;
  declare readonly messageListTargets: HTMLElement[];

  connect() {}

  handleUserUtterance({ detail }: { detail: string }) {
    if (detail) this.messageListTarget.innerHTML += detail;
  }
}
