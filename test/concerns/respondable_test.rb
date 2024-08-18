# frozen_string_literal: true

require 'test_helper'
require 'minitest/mock'

class RespondableTest < ActiveSupport::TestCase
  # test 'We get correct responses when the client is mocked' do
  #  respondable = Object.new
  #  respondable.extend(Respondable)

  #  respondable.openai_client = Minitest::Mock.new
  #  [true, false].each do |respond_result|
  #    content = JSON.dump({
  #                          finished_speaking: true,
  #                          being_addressed_directly: true,
  #                          should_respond: respond_result
  #                        })
  #    expected_json_response = { 'choices' => [{ 'message' => { 'content' => content } }] }
  #    expected_parameters = { model: Respondable::MODEL,
  #                            messages: [{ role: 'system',
  #                                         content: Respondable::SYSTEM_PROMPT.gsub('<LANGUAGE/>', 'italian') }],
  #                            response_format: { type: 'json_object' },
  #                            temperature: Respondable::TEMPERATURE,
  #                            top_p: Respondable::TOP_P }
  #    respondable.openai_client.expect(:chat, expected_json_response, [], parameters: expected_parameters)
  #    assert_equal respondable.should_respond?([], 'italian'), respond_result
  #  end
  # end

  # test 'Check that the LLM returns sensible results in reality ' do
  #  skip unless ENV['EXPENSIVE_TESTS'] == 'true'

  #  obj = Object.new
  #  obj.extend(Respondable)

  #  conversations_that_should_respond = [
  #    [
  #      { 'speaker' => 'user', 'utterance' => 'Hello there, what is up my good friend?' }
  #    ],
  #    [
  #      { 'speaker' => 'user', 'utterance' => 'What is the difference between the words apple and orange' }
  #    ]
  #  ]

  #  conversations_that_should_not_respond = [
  #    [
  #      { 'speaker' => 'user', 'utterance' => 'Hello there, I was wondering' }
  #    ],
  #    [
  #      { 'speaker' => 'user', 'utterance' => 'Can you teach me how to' }
  #    ],
  #    [
  #      { 'speaker' => 'user', 'utterance' => 'What is the difference between' }
  #    ]
  #  ]

  #  conversations_that_should_respond.each do |c|
  #    assert_equal obj.should_respond?(c, 'english'), true, "Conversation: #{c}"
  #  end

  #  conversations_that_should_not_respond.each do |c|
  #    assert_equal obj.should_respond?(c, 'english'), false, "Conversation: #{c}"
  #  end
  # end
end
