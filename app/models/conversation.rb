# frozen_string_literal: true

class Conversation < ApplicationRecord
  include ActionView::RecordIdentifier # for the dom_id function

  belongs_to :user
  has_one_attached :audio

  # You need to update the postgres enum if you update this list
  STATUSES = %w[initialising in_progress finishing completed error].freeze
  enum status: STATUSES.zip(STATUSES).to_h

  def self.with_users_language(current_user)
    current_user.conversations.new(language: current_user.language)
  end

  def transcription_text
    transcription.sort_by { |t| t['ts'] }.map { |t| t['elements'].pluck('value').join }.join
  end

  after_update do
    broadcast_replace_to self, partial: 'conversations/chat', target: "#{dom_id(self)}-chat"
  end

  def receive_transcription(data)
    transcription.push(data)
    add_user_utterance(data['elements'].pluck('value').join)
    save!
  end

  def add_user_utterance(utterance)
    # history.push({ speaker: 'assistant', utterance: "sdfsdfsf#{history.length}" }) if history.length.even?
    if !history.empty? && history.last['speaker'] == 'user'
      history.last['utterance'] += utterance
    else
      history.push({ speaker: 'user', utterance: })
    end
  end
end
