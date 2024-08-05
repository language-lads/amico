# frozen_string_literal: true

SYSTEM_PROMPT = "You are an educated <LANGUAGE/> person.
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

class OpenAiClient
  def initialize(api_key, language, log_errors)
    @client = OpenAI::Client.new(
      access_token: api_key,
      log_errors:
    )
    @language = language
    @model = 'gpt-4o'
    @temperature = 0.7
  end

  def get_response(history)
    messages = [{ role: 'system', content: system_prompt }]
    history.each do |message|
      messages.push({ role: message['speaker'], content: message['utterance'] })
    end
    @client.chat(parameters: { model: @model, messages:, temperature: @temperature })
  end

  private

  def system_prompt
    SYSTEM_PROMPT.gsub('<LANGUAGE/>', @language)
  end
end

# This can be used in development mode to test the client without using the OpenAI API
if Rails.configuration.mock_open_ai_client
  class OpenAiClient
    def initialize(_api_key, _language, _log_errors)
      Rails.logger.debug('Mock OpenAI client initialized')
    end

    def get_response(_history)
      { 'choices' => [{ 'message' => { 'content' => 'This is a mock response' } }] }
    end

    private

    def system_prompt
      SYSTEM_PROMPT.gsub('<LANGUAGE/>', 'English')
    end
  end
end
