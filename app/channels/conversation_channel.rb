# frozen_string_literal: true

require 'wavefile'
require 'tempfile'

class ConversationChannel < ApplicationCable::Channel
  include WaveFile

  def subscribed
    stream_from "conversation_#{params['id']}"
    @format = Format.new(:mono, :float, 16_000)
    @cache = ActiveSupport::Cache::RedisCacheStore.new
    clear_audio_samples
  end

  def unsubscribed
    conversation = Conversation.find(params['id'])

    # Write to a temporary file
    Tempfile.create do |f|
      f.binmode
      Writer.new(f, @format) do |writer|
        writer.write(Buffer.new(audio_samples, @format))
      end
      conversation.audio.attach(io: File.open(f.path), filename: 'conversation_recording.wav',
                                content_type: 'audio/wav')
      conversation.update!(status: :completed)
    end
    clear_audio_samples
  end

  def receive(data)
    append_audio_samples(data['audio_samples'])
  end

  private

  def audio_samples
    @cache.read("conversation_#{params['id']}") || []
  end

  def append_audio_samples(samples)
    @cache.write("conversation_#{params['id']}", audio_samples.concat(samples))
  end

  def clear_audio_samples
    @cache.write("conversation_#{params['id']}", [])
  end
end
