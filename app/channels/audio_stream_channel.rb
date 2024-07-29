# frozen_string_literal: true

class AudioStreamChannel < ApplicationCable::Channel
  def subscribed
    stream_from "conversation_audio_stream_#{params['id']}"
    Rails.logger.debug { "Subscribed to conversation_audio_stream_#{params['id']}" }
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    Rails.logger.debug { "Unsubscribed from conversation_audio_stream_#{params['id']}" }
  end
end
