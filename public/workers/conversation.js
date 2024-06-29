// The main background worker that coordinates
// the voice activity detection (VAD) and
// speech to text by spawing sub workers
//
// Receives 16kHz audio data from the main thread
// and passes it around to the sub workers

/**
 * @param {{data: string}}
 */
onmessage = ({ data }) => {
  //console.debug("Conversation worker received: ", data);
};
