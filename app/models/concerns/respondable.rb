# frozen_string_literal: true

# Logic for generating a response to a user message
module Respondable
  RESPONDABLE_MODEL = 'gpt-4o'
  RESPONDABLE_TEMPERATURE = 0.7
  RESPONDABLE_TOP_P = 0.5
  RESPONDABLE_SYSTEM_PROMPT = "You are an educated <LANGUAGE/> person.
    You are helping a friend of yours who does not speak very good <LANGUAGE/>,
    and will correct them where possible.
    You ask clarifying questions when necessary.
    You only ever speak and use <LANGUAGE/> words.
    You are terse and to the point and do not use frivolous language or
    punctuation like exclamation marks.
    When giving your answer do not respond with more than a few sentences at a time,
    like a regular person would in a normal conversation.
    Never use punctuation like list dot points or numbered lists.
  "

  def get_response(conversation_history, language)
    messages = [{ role: 'system', content: RESPONDABLE_SYSTEM_PROMPT.gsub('<LANGUAGE/>', language) }]
    conversation_history.each do |message|
      messages.push({ role: message['speaker'], content: message['utterance'] })
    end
    response = respondable_openai_client.chat(parameters:
    { model: RESPONDABLE_MODEL, temperature: RESPONDABLE_TEMPERATURE, top_p: RESPONDABLE_TOP_P,
      messages: }).dig('choices', 0, 'message', 'content')
    Rails.logger.debug { "Respondable: #{response}" }
    response
  end

  attr_writer :openai_client

  def respondable_openai_client
    @respondable_openai_client ||= OpenAI::Client.new(
      access_token: Rails.application.credentials.openai[:api_key],
      log_errors: false
    )
  end

  def respondable_params; end
end
