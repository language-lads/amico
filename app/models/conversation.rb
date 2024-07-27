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
    client = OpenAI::Client.new(
      access_token: Rails.application.credentials.openai[:api_key],
      log_errors: true # Highly recommended in development, so you can see what errors OpenAI is returning. Not recommended in production because it could leak private data to your logs.
    )
    language = user.language_details[:english_name]
    messages = [{ role: 'system',
                  content: "You are an educated #{language} person. You are helping a friend of yours who does not speak very good #{language}, and will correct them where possible.  You ask clarifying questions when necessary. You only ever speak and use #{language} words. You are terse and to the point and do not use frivolous language or punctuation like exclamation marks. When giving your answer do not respond with more than a few sentences at a time, like a regular person would in a normal conversation. Never use punctuation like list dot points or numbered lists." }]
    history.each do |message|
      if message['speaker'] == 'user'
        messages.push({ role: 'user', content: message['utterance'] })
      else
        messages.push({ role: 'assistant', content: message['utterance'] })
      end
    end
    response = client.chat(parameters: {
                             model: 'gpt-4o',
                             messages:,
                             temperature: 0.7
                           })
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
    if !history.empty? && history.last['speaker'] == 'assistant'
      history.last['utterance'] += utterance
    else
      history.push({ speaker: 'assistant', utterance: })
    end
    save!
  end
end
