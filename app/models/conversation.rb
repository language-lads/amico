# frozen_string_literal: true

class Conversation < ApplicationRecord
  include ActionView::RecordIdentifier # for the dom_id function
  include Waitable
  include Speakable

  belongs_to :user
  has_one_attached :audio

  # You need to update the postgres enum if you update this list
  STATUSES = %w[initialising in_progress finishing completed error].freeze
  enum status: STATUSES.zip(STATUSES).to_h

  def self.with_users_language(current_user)
    current_user.conversations.new(language: current_user.language)
  end

  def broadcast_error(error_message)
    update!(status: :error, error_message:)
    ConversationChannel.broadcast_to self, 'STOP' # Stop the conversation on the client side
  end

  def transcription_text
    transcription.sort_by { |t| t['ts'] }.map { |t| t['elements'].pluck('value').join }.join
  end

  def audio_recording_file_name
    "conversation_recording_#{id}.wav"
  end

  after_update do
    broadcast_replace_to self, partial: 'conversations/chat', target: "#{dom_id(self)}-chat" if saved_change_to_history?
    if saved_change_to_status?
      broadcast_replace_to self, partial: 'conversations/status', target: "#{dom_id(self)}-status"
    end
  end

  def receive_transcription(data) # rubocop:disable Metrics/AbcSize
    transcription.push(data)
    add_user_utterance(data['elements'].pluck('value').join)
    return unless should_respond?(history, user.language_english_name)

    client = OpenAiClient.new(
      Rails.application.credentials.openai[:api_key],
      user.language_details[:english_name]
    )
    response = client.get_response(history)
    add_assistant_utterance(response.dig('choices', 0, 'message', 'content'))
    save!
  end

  def add_user_utterance(utterance)
    if !history.empty? && history.last['speaker'] == 'user'
      history.last['utterance'] += utterance
    else
      history.push({ speaker: 'user', utterance: })
    end
    save!
  end

  def add_assistant_utterance(utterance)
    audio_chunks = ''
    to_speech(utterance, user.language_details[:code]) do |chunk|
      audio_chunks += chunk
    end
    ActionCable.server.broadcast("conversation_audio_stream_#{id}", Base64.encode64(audio_chunks))
    history.push({ speaker: 'assistant', utterance: })
    save!
  end
end
