# frozen_string_literal: true

require 'wavefile'
require 'tempfile'

class ConversationChannel < ApplicationCable::Channel
  include WaveFile

  def subscribed
    stream_from "conversation_#{params['id']}"
    @audio_samples = []
    @format = Format.new(:mono, :float, 16_000)
  end

  def unsubscribed
    conversation = Conversation.find(params['id'])

    # Write to a temporary file
    Tempfile.create do |f|
      f.binmode
      Writer.new(f, @format) do |writer|
        writer.write(Buffer.new(@audio_samples, @format))
      end
      conversation.audio.attach(io: File.open(f.path), filename: 'conversation_recording.wav',
                                content_type: 'audio/wav')
      conversation.update!(status: :completed)
    end
  end

  def receive(data)
    @audio_samples.concat(data['audio_samples'])
  end
end
