const BUFFER_SIZE = 4096; // Roughly 256ms of data at 16kHz

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
    this.buffer = [];

    // Receive the audio stream settings (sampleRate etc.)
    this.port.onmessage = (e) => {
      /**
       * @type {MediaTrackSettings}
       * @public
       */
      this.audioSettings = e.data;

      // Create a new resampler
      const { create, ConverterType } = globalThis.LibSampleRate;
      let nChannels = this.audioSettings.channelCount || 1;
      let inputSampleRate = this.audioSettings.sampleRate;
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
    //this.port.postMessage(Array.from(input));

    //const resampledValues = Array.from(this.sampler.full(input));
    //this.port.postMessage(resampledValues);

    //const resampledValues = Array.from(this.sampler.full(input));
    //const timestamp = Date.now() / 1000; // Decimal seconds

    //// Add timestamps to the resampled values, noting that the
    //// the timestamp above corresponds to last sample in the input
    //const resampledValuesWithTimestamps = resampledValues.map(
    //  (value, index) => {
    //    return {
    //      value,
    //      timestamp: timestamp - (resampledValues.length - index) / 16000,
    //    };
    //  },
    //);

    this.buffer.push(...Array.from(this.sampler.full(input)));
    if (this.buffer.length >= BUFFER_SIZE) {
      // Take the first BUFFER_SIZE samples
      this.port.postMessage(this.buffer.slice(0, BUFFER_SIZE));
      // Remove the first BUFFER_SIZE samples
      this.buffer = this.buffer.slice(BUFFER_SIZE);
    }
    return true;
  }
}

// Register the processor
registerProcessor("resample-to-16kHz", ResampleTo16kHz);
