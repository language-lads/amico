// The main background worker that coordinates
// the voice activity detection (VAD) and
// speech to text by spawing sub workers
//
// Receives 16kHz audio data from the main thread
// and passes it around to the sub workers

/**
 * @param {Float32Array} inputs
 */
onmessage = ({ data }) => {
  //// We only want to send ~500 samples per second
  //// to the chart
  const reduction_factor = 16000 / 500;
  const reduced_audio = data.filter((_, i) => i % reduction_factor === 0);
  postMessage({
    type: "audio",
    data: reduced_audio,
  });
};
