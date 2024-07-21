# frozen_string_literal: true

require 'wavefile'
require 'tempfile'

class ConversationChannel < ApplicationCable::Channel
  include WaveFile

  def subscribed
    stream_from "conversation_#{params['id']}"
    @format = Format.new(:mono, :float, 16_000)
    @filename = "conversation_recording_#{params['id']}.wav"
    @content_type = 'audio/wav'
    # @cache = ActiveSupport::Cache::RedisCacheStore.new
    @audio_samples = []
    clear_audio_samples
  end

  def unsubscribed
    conversation = Conversation.find(params['id'])
    Tempfile.create do |f|
      f.binmode
      Writer.new(f, @format).write(Buffer.new(sorted_audio_samples, @format))
      conversation.audio.attach(io: File.open(f.path), filename: @filename, content_type: @content_type)
      conversation.update!(status: :completed)
    end
    clear_audio_samples
  end

  def receive(data)
    append_audio_data(data)
  end

  private

  # ActionCable doesn't guarantee the order of messages, so we need to sort them before
  # writing the audio file
  def sorted_audio_samples
    audio_data.sort_by { |d| d[:order] }.pluck('audio_samples').flatten(1)
  end

  def audio_data
    @audio_samples
    # @cache.read("conversation_#{params['id']}") || []
  end

  def append_audio_data(data)
    @audio_samples.push(data)
    # array = audio_data
    # array.push(data)
    # @cache.write("conversation_#{params['id']}", array)
  end

  def clear_audio_samples
    @audio_samples = []
    # @cache.write("conversation_#{params['id']}", [])
  end
end
