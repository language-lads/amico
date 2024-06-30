// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails";
import "controllers";

import VoiceActivityDetection from "classes/voice_activity_detection";
new VoiceActivityDetection();

import LocalTime from "local-time";
LocalTime.start();
