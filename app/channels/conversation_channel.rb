# frozen_string_literal: true

require 'wavefile'
require 'tempfile'

class ConversationChannel < ApplicationCable::Channel
  include WaveFile

  def subscribed # rubocop:disable Metrics/MethodLength, Metrics/AbcSize
    @conversation = Conversation.find(params['id'])
    stream_for @conversation
    @transcription_client = RevAiClient.new(Rails.application.credentials.dig(:rev_ai, :access_token),
                                            @conversation.language)

    @transcription_client.on_transcript = @conversation.method(:receive_transcription)
    @transcription_client.on_connection_ready = method(:on_transcription_service_ready)
    @transcription_client.on_error = method(:on_transcription_service_error)
    @transcription_client.connect

    @audio_samples = []
    @out_of_order_samples = []
    clear_audio_samples
  end

  def on_transcription_service_ready
    Rails.logger.debug('Transcription service ready')
    @conversation.update!(status: :in_progress)
  end

  def on_transcription_service_error(reason)
    @transcription_client = nil
    @conversation.broadcast_error("Transcription Service: #{reason}")
  end

  def unsubscribed # rubocop:disable Metrics/MethodLength, Metrics/AbcSize
    return if @conversation.error?

    @transcription_client&.disconnect
    Tempfile.create do |f|
      f.binmode
      samples = @audio_samples.pluck('audio_samples').flatten(1)
      format = Format.new(:mono, :float, 16_000)
      Writer.new(f, format).write(Buffer.new(samples, format))
      @conversation.audio.attach(io: File.open(f.path), filename: @conversation.audio_recording_file_name,
                                 content_type: 'audio/wav')
    end
    @conversation.update!(status: :completed)
    clear_audio_samples
  end

  # ActionCable doesn't guarantee the order of messages, so we need to sort them before writing the audio file
  def receive(data) # rubocop:disable Metrics/MethodLength, Metrics/AbcSize
    return unless @transcription_client

    if @audio_samples.empty?
      append_audio_data(data)
      return
    end

    if @audio_samples.last['order'] + 1 == data['order']
      # Put our message in if we're the next one
      append_audio_data(data)
    else
      # Otherwise, put it in the out of order queue to reconcile later
      @out_of_order_samples.push(data)
    end

    return unless @out_of_order_samples.any?

    # Reconcile out of order messages
    while (next_sample = @out_of_order_samples.find { |s| s['order'] == @audio_samples.last['order'] + 1 })
      append_audio_data(next_sample)
      @out_of_order_samples.delete(next_sample)
    end
  end

  private

  def append_audio_data(data)
    @audio_samples.push(data)
    pcm_16_data = RevAiClient.convert_float32_to_pcm16(data['audio_samples'])
    @transcription_client.send(pcm_16_data.pack('s<*').bytes)
  end

  def clear_audio_samples
    @audio_samples = []
  end
end
