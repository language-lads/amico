// Define the processor class
class AudioSampleProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      for (let i = 0; i < inputChannel.length; i++) {
        // For this example, we're just passing the audio through.
        // Here, you could analyze or modify the samples.
        outputChannel[i] = inputChannel[i];

        // Example: Log the first sample of each buffer to the console
        if (i === 0) console.log("Receiving audio data...");
      }
    }
    return true;
  }
}

// Register the processor
registerProcessor("audio-sample-processor", AudioSampleProcessor);
