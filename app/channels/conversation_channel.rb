# frozen_string_literal: true

require 'wavefile'
require 'tempfile'

class ConversationChannel < ApplicationCable::Channel
  include WaveFile

  def subscribed
    stream_from "conversation_#{params['id']}"
    @conversation = Conversation.find(params['id'])
    @format = Format.new(:mono, :float, 16_000)
    @filename = "conversation_recording_#{params['id']}.wav"
    @content_type = 'audio/wav'
    @rev_ai_client = RevAiClient.new(Rails.application.credentials.dig(:rev_ai, :access_token), @conversation.language)
    @rev_ai_client.connect(method(:receive_transcription))
    @audio_samples = []
    @out_of_order_samples = []
    clear_audio_samples
  end

  def unsubscribed
    Tempfile.create do |f|
      f.binmode
      samples = @audio_samples.pluck('audio_samples').flatten(1)
      Writer.new(f, @format).write(Buffer.new(samples, @format))
      @conversation.audio.attach(io: File.open(f.path), filename: @filename, content_type: @content_type)
      @conversation.update!(status: :completed)
    end
    @rev_ai_client.disconnect
    clear_audio_samples
  end

  # ActionCable doesn't guarantee the order of messages, so we need to sort them before writing the audio file
  def receive(data)
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

  def receive_transcription(data)
    Rails.logger.debug { "Received transcription: #{data}" }
    @conversation.transcription.push(data)
    @conversation.save!
  end

  private

  def append_audio_data(data)
    @audio_samples.push(data)
    pcm_16_data = RevAiClient.convert_float32_to_pcm16(data['audio_samples'])
    @rev_ai_client.send(pcm_16_data.pack('s<*').bytes)
  end

  def clear_audio_samples
    @audio_samples = []
  end
end
