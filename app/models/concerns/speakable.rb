# frozen_string_literal: true

# Logic for converting text to speech
module Speakable
  ELEVENLABS_FQDN = 'https://api.elevenlabs.io'
  ELEVENLABS_OUTPUT_FORMAT = 'mp3_22050_32' # The PCM format has audio stuttering for some reason
  ELEVENLABS_VOICE_ID = 'IKne3meq5aSn9XLyUdCD' # Charlie https://api.elevenlabs.io/v1/voices
  ELEVENLABS_MODEL_ID = 'eleven_turbo_v2_5'

  def to_speech(text, language_code, &)
    json = {
      text:,
      model_id: ELEVENLABS_MODEL_ID,
      language_code:
    }
    response = elevenlabs_client.post(elevenlabs_url, params: elevenlabs_params, json:)
    response.body.each(&)
  end

  attr_writer :elevenlabs_client

  def elevenlabs_client
    @elevenlabs_client ||= HTTP.headers('xi-api-key': Rails.application.credentials.dig(:elevenlabs, :api_key))
  end

  def elevenlabs_url
    "#{ELEVENLABS_FQDN}/v1/text-to-speech/#{ELEVENLABS_VOICE_ID}/stream"
  end

  def elevenlabs_params
    { output_format: ELEVENLABS_OUTPUT_FORMAT }
  end
end
