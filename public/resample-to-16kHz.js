/**
 * Processor to resample audio samples to 32 bit float, 16kHz samples
 *
 * Our VAD and STT models generally require 16kHz audio samples.
 *
 * @extends AudioWorkletProcessor
 */
class ResampleTo16kHz extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args);
    // Receive the audio stream settings (sampleRate etc.)
    this.port.onmessage = (e) => {
      /**
       * @type {MediaTrackSettings}
       * @public
       */
      this.trackSettings = e.data;

      // Create a new resampler
      const { create, ConverterType } = globalThis.LibSampleRate;
      let nChannels = this.trackSettings.channelCount;
      let inputSampleRate = this.trackSettings.sampleRate;
      let outputSampleRate = 16000; // kHz
      create(nChannels, inputSampleRate, outputSampleRate, {
        converterType: ConverterType.SRC_SINC_BEST_QUALITY, // or some other quality
      }).then((sampler) => {
        this.sampler = sampler;
      });
    };
  }

  /**
   * Resample to 16kHz and return to the main thread
   * @param {Float32Array[][]} inputs
   * @param {Float32Array[][]} outputs
   * @param {any} parameters
   */
  process(inputs, _outputs, _parameters) {
    const input = inputs[0][0];
    const resampled16kHz = this.sampler.full(input);
    this.port.postMessage(Array.prototype.slice.call(resampled16kHz));
    return true;
  }
}

// Register the processor
registerProcessor("resample-to-16kHz", ResampleTo16kHz);
