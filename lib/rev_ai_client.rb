# frozen_string_literal: true

require 'faye/websocket'
require 'eventmachine'
require 'json'
require 'concurrent'
require 'wavefile'

class RevAiClient
  include WaveFile
  attr_reader :thread

  def initialize(access_token, language)
    @access_token = access_token
    @content_type = 'audio/x-raw'
    @layout = 'interleaved'
    @sample_rate = 16_000
    # We have to use this format for other languages according to the API
    # https://gstreamer.freedesktop.org/documentation/additional/design/mediatype-audio-raw.html?gi-language=c#formats
    # https://docs.rev.ai/api/streaming/requests/#language
    @format = 'S16LE'
    @language = language
    @channels = 1
    @url = "wss://api.rev.ai/speechtotext/v1/stream?access_token=#{@access_token}&content_type=#{@content_type};layout=#{@layout};rate=#{@sample_rate};format=#{@format};channels=#{@channels}&language=#{@language}"
    @thread = nil
    # Lock so we can safely access the websocket from multiple threads
    @lock = Concurrent::ReadWriteLock.new
  end

  # Runs on a separate thread
  def connect(on_final_transcript)
    @thread = Thread.new do
      EM.run do
        @lock.with_write_lock do
          @ws = Faye::WebSocket::Client.new(@url)

          @ws.on :open do |_event|
            Rails.logger.debug 'Connected'
          end

          @ws.on :message do |event|
            response = JSON.parse(event.data)
            if response['type'] == 'final'
              # Add a space after every '.' and '?' to make the transcript more readable
              response['elements'].each do |element|
                element['value'] = element['value'].gsub(/([.?!])/, '\1 ')
              end
              on_final_transcript.call(response)
            end
          end

          @ws.on :close do |event|
            Rails.logger.debug { "Disconnected with code: #{event.code}, reason: #{event.reason} " }
            EventMachine.stop_event_loop
          end

          @ws.on :error do |event|
            Rails.logger.debug { "Error: #{event.message}" }
            EventMachine.stop_event_loop
          end
        end
      end
    end
  end

  def send(data)
    @lock.with_write_lock { @ws.send(data) }
  end

  def disconnect
    @lock.with_write_lock { @ws.close }
    @thread.join
  end

  def self.convert_float32_to_pcm16(float32_array)
    float_format = WaveFile::Format.new(:mono, :float, 16_000)
    pcm_format = WaveFile::Format.new(:mono, :pcm_16, 16_000)
    WaveFile::Buffer.new(float32_array, float_format).convert(pcm_format).samples
  end

  private

  def ws=(websocket)
    @lock.with_write_lock { @ws = websocket }
  end
end

# This can be used in development mode to test the client without connecting to the Rev.ai API
if Rails.configuration.mock_rev_ai_client
  class RevAiClient
    def connect(on_final_transcript)
      @thread = Thread.new do
        EM.run do
          # Periodically call the on_final_transcript callback with a random transcript
          EventMachine.add_periodic_timer(1) do
            on_final_transcript.call({ 'type' => 'final',
                                       'elements' => [{ 'type' => 'text', 'value' => 'hello ' }] })
          end
        end
      end
    end

    def disconnect
      # This probably doesn't work for multiple threads
      EventMachine.stop_event_loop
      @thread.join
    end

    def send(data) end
  end
end
