# frozen_string_literal: true

# Logic for determining whether we should respond to a user message
module Respondable
  MODEL = 'gpt-4o'
  TEMPERATURE = 0.5
  TOP_P = 0.5

  SYSTEM_PROMPT = "You are a <LANGUAGE/> smart assistant that determines whether it is an
  appropriate time in a conversation where a polite <LANGUAGE/> person would respond.
  This polite person only responds if it they are asked a direct question.
  You are given a conversation in <LANGUAGE/>, between a user and a polite person.
  The user is not good at writing with perfect punctuation,
  so there may be missing question marks and full stops that you will need to interpret.
  You will be patient and only respond when it is appropriate.
  You will first think through the following steps:
  1. Is likely that the user has finished speaking?
  2. Is the user addressing the polite person directly?
  3. Considering the first two options, should the polite person respond?

  Give your response as a JSON object with the sample format:
  { \"finished_speaking\": true, \"being_addressed_directly\": true, \"should_respond\": true }

  If the user has not finished speaking, set \"finished_speaking\" to false.
  If the user is not addressing the polite person directly, set \"being_addressed_directly\" to false.
  If both of the above are true, set \"should_respond\" to true.
  If either of the above are false, set \"should_respond\" to false.
  "

  # Uses the StructuredOutput format of the OpenAI API
  RESPONSE_FORMAT = {
    type: 'json_schema',
    json_schema: {
      name: 'response_detection',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          finished_speaking: {
            type: 'boolean'
          },
          being_addressed_directly: {
            type: 'boolean'
          },
          should_respond: {
            type: 'boolean'
          }
        },
        required: %w[
          finished_speaking
          being_addressed_directly
          should_respond
        ],
        additionalProperties: false
      }
    }
  }.freeze

  def should_respond?(conversation_history, language)
    messages = [{ role: 'system', content: SYSTEM_PROMPT.gsub('<LANGUAGE/>', language) }]
    conversation_history.each do |message|
      messages.push({ role: message['speaker'], content: message['utterance'] })
    end
    response = openai_client.chat(parameters: { model: MODEL, messages:, temperature: TEMPERATURE, top_p: TOP_P,
                                                response_format: { type: 'json_object' } })
    parsed_response = JSON.parse(response.dig('choices', 0, 'message', 'content'))
    Rails.logger.debug { "Respondable: #{parsed_response}" }
    parsed_response['should_respond']
  end

  attr_writer :openai_client

  def openai_client
    @openai_client ||= OpenAI::Client.new(
      access_token: Rails.application.credentials.openai[:api_key],
      log_errors: false
    )
  end
end
