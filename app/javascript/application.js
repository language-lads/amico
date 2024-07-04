// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails";
import "controllers";

import LocalTime from "local-time";
LocalTime.start();

// Javascript jobs to do fancy AI inference on the browser
import VoiceActivityDetection from "jobs/voice_activity_detection";
new VoiceActivityDetection();

import Whisper from "jobs/whisper";
new Whisper();
