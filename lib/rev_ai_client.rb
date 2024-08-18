# frozen_string_literal: true

require 'faye/websocket'
require 'eventmachine'
require 'json'
require 'concurrent'
require 'wavefile'

class RevAiClient
  include WaveFile

  attr_accessor :on_transcript, :on_connection_ready, :on_error

  def initialize(access_token, language)
    @access_token = access_token
    @language = language
    @lock = Concurrent::ReadWriteLock.new # So we can safely access the websocket from multiple threads
    @ws = nil
    @thread = nil
  end

  def connect
    raise 'Websocket already connected' unless @ws.nil?

    start_event_machine
  end

  def send(data)
    raise 'Unable to send, websocket not connected' if @ws.nil?

    @lock.with_write_lock { @ws.send(data) }
  end

  def disconnect
    return if @ws.nil?

    @lock.with_write_lock do
      @ws.close
      @ws = nil
    end

    return if @thread.nil?

    @thread.join
    @thread = nil
  end

  # Convert a float32 array to PCM16 samples
  def self.convert_float32_to_pcm16(float32_array)
    float_format = WaveFile::Format.new(:mono, :float, 16_000)
    pcm_format = WaveFile::Format.new(:mono, :pcm_16, 16_000) # rubocop:disable Naming/VariableNumber
    WaveFile::Buffer.new(float32_array, float_format).convert(pcm_format).samples
  end

  private

  # It's necessary to have the content type in a certain format for Rev.ai to accept
  # https://gstreamer.freedesktop.org/documentation/additional/design/mediatype-audio-raw.html?gi-language=c#formats
  # https://docs.rev.ai/api/streaming/requests/#language
  def url
    'wss://api.rev.ai/speechtotext/v1/stream?' \
      "access_token=#{@access_token}&" \
      "language=#{@language}&" \
      'content_type=audio/x-raw;' \
      'layout=interleaved;' \
      'rate=16000;' \
      'format=S16LE;' \
      'channels=1'
  end

  def start_event_machine
    @thread = Thread.new do
      EM.run do
        @lock.with_write_lock do
          setup_websocket
        end
        EventMachine.add_shutdown_hook { on_event_machine_shutdown }
      end
    end
  end

  def setup_websocket
    @ws = Faye::WebSocket::Client.new(url)
    @ws.on :open do |event|
      on_websocket_open(event)
    end
    @ws.on :message do |event|
      on_websocket_message(event)
    end
    @ws.on :close do |event|
      on_websocket_close(event)
    end
  end

  def on_event_machine_shutdown
    Rails.logger.debug { 'Closing event machine loop' }
    @lock.with_write_lock do
      @ws&.close
      @ws = nil
    end
  end

  def on_websocket_open(event)
    Rails.logger.debug { "Connected with code: #{event}" }
    @on_connection_ready&.call
  end

  def on_websocket_message(event)
    Rails.logger.debug { "Received message: #{event.data}" }
    response = JSON.parse(event.data)

    # Add a space after every '.' and '?' to make the transcript more readable
    if response['type'] == 'final'
      response['elements'].each do |element|
        element['value'] = element['value'].gsub(/([.?!])/, '\1 ')
      end
    end

    @on_transcript&.call(response)
  end

  def on_websocket_close(event)
    Rails.logger.debug { "Disconnected with code: #{event.code}, reason: #{event.reason}" }
    EventMachine.stop_event_loop
    return unless event.code != 1_000 && event.code != 1_001 # These are normal close codes

    @on_error&.call(event.reason)
  end
end

## This can be used in development mode to test the client without connecting to the Rev.ai API
# if Rails.configuration.mock_speech_to_text_client
#  class RevAiClient
#    MESSAGE = { 'type' => 'final',
#                'elements' => [{ 'type' => 'text', 'value' => 'I am a mocked transcription.' }] }.freeze
#    FREQUENCY = 10 # seconds

#    def initialize(_access_token, _language)
#      Rails.logger.debug('Mock RevAI client initialized')
#    end

#    def connect
#      @thread = Thread.new do
#        EM.run do
#          EventMachine.add_timer(1) do
#            @on_connection_ready&.call
#            @on_transcript&.call(MESSAGE)
#          end
#          EventMachine.add_periodic_timer(FREQUENCY) { @on_transcript&.call(MESSAGE) }
#        end
#      end
#    end

#    def disconnect
#      EventMachine.stop_event_loop
#      @thread.join
#      @thread = nil
#    end

#    def send(data) end
#  end
# end
