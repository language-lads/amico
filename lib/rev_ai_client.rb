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
    # @format = 'S16LE'
    # 32-bit floating-point audio
    # We have to use this format for other languages according to the API
    # https://gstreamer.freedesktop.org/documentation/additional/design/mediatype-audio-raw.html?gi-language=c#formats
    # https://docs.rev.ai/api/streaming/requests/#language
    @format = 'S16LE'
    @language = language
    @channels = 1
    @url = "wss://api.rev.ai/speechtotext/v1/stream?access_token=#{@access_token}&content_type=#{@content_type};layout=#{@layout};rate=#{@sample_rate};format=#{@format};channels=#{@channels}&language=#{@language}"
    @thread = nil
    @lock = Concurrent::ReadWriteLock.new
  end

  def ws=(websocket)
    @lock.with_write_lock { @ws = websocket }
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
            on_final_transcript.call(response) if response['type'] == 'final'
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

  def ping
    @lock.with_write_lock do
      @ws.ping 'ping' do
        Rails.logger.debug 'Pong received'
      end
    end
  end

  def stream
    raw_audio_data = File.binread('./conversation.raw').bytes
    @lock.with_write_lock do
      raw_audio_data.each_slice(20_480) do |chunk|
        @ws.send(chunk)
      end
    end
    nil
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
end
