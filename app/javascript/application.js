// Entry point for the build script in your package.json
import "@hotwired/turbo-rails";
import "./controllers";

import LocalTime from "local-time";
LocalTime.start();

//// Javascript jobs to do fancy AI inference on the browser
//import VoiceActivityDetection from "./jobs/voice_activity_detection";
//new VoiceActivityDetection();

//import AudioChunking from "./jobs/audio_chunking";
//new AudioChunking();

//import Whisper from "./jobs/whisper";
//window.Whisper = new Whisper();
