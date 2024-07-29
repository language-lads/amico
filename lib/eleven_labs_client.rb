# frozen_string_literal: true

class ElevenLabsClient
  include WaveFile
  ELEVENLABS_FQDN = 'https://api.elevenlabs.io'

  def initialize(api_key, language_code)
    @api_key = api_key
    @voice_id = 'IKne3meq5aSn9XLyUdCD' # Charlie https://api.elevenlabs.io/v1/voices
    # @output_format = 'pcm_16000' # PCM format (S16LE) with 16kHz sample rate
    @output_format = 'mp3_22050_32' # The PCM format has audio stuttering for some reason
    @model_id = 'eleven_turbo_v2_5'
    @language_code = language_code
  end

  def text_to_speech(text, &)
    url_path = "#{ELEVENLABS_FQDN}/v1/text-to-speech/#{@voice_id}/stream"
    http_client = HTTP.headers('xi-api-key': @api_key)
    response = http_client.post(url_path,
                                params: { output_format: @output_format },
                                json: body(text))
    response.body.each(&)
  end

  def test_mp3
    message = 'Allora, la partita che abbiamo appena finito è stata senza ombra di dubbio una partita'
    File.open('test2.mp3', 'wb') do |f|
      text_to_speech(message) do |chunk|
        f.write(chunk)
      end
    end
  end

  private

  def body(text)
    {
      text:,
      model_id: @model_id,
      language_code: @language_code
    }
  end
end

# This can be used in development mode to test the client without using the OpenAI API
if Rails.configuration.mock_text_to_speech_client
  class ElevenLabsClient
    def text_to_speech(_text, &)
      Rails.logger.debug { "Mock response from ElevenLabs for #{@language_code}" }
      File.open("test/audio/#{@language_code}.mp3", 'rb') do |f|
        until f.eof?
          yield f.read(1024) # 1KB chunks
        end
      end
    end
  end
end
