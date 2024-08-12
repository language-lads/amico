# frozen_string_literal: true

require 'test_helper'
require 'minitest/mock'

class RevAiClientTest < ActiveSupport::TestCase
  setup do
    Rails.configuration.mock_speech_to_text_client = false
  end

  test 'The on_connection_ready callback is called and we can terminate gracefully' do
    access_token = Rails.application.credentials.dig(:rev_ai, :access_token)

    # Mocks to check if the callbacks are called
    on_connection_ready_called = false
    on_connection_ready = proc { on_connection_ready_called = true }
    on_transcript_called = false
    on_transcript = proc { on_transcript_called = true }
    on_error_called = false
    on_error = proc { on_error_called = true }

    client = RevAiClient.new(access_token, 'en')
    client.on_connection_ready = on_connection_ready
    client.on_transcript = on_transcript
    client.on_error = on_error
    client.connect

    sleep 5
    assert on_connection_ready_called
    assert_not on_transcript_called
    assert_not on_error_called
    assert_raises(RuntimeError, 'Websocket already connected') do
      client.connect
    end

    # Terminate gracefully
    client.disconnect
    sleep 5
    assert_not on_error_called
    assert_raises(RuntimeError, 'Unable to send, websocket not connected') do
      client.send('something')
    end
  end

  test 'Fails if the access_token is incorrect' do
    access_token = 'asdf'
    on_error_called = false
    on_error = proc { on_error_called = true }

    client = RevAiClient.new(access_token, 'en')
    client.on_error = on_error
    client.connect

    sleep 5
    assert on_error_called
    assert_raises(RuntimeError, 'Unable to send, websocket not connected') do
      client.send('something')
    end
  end
end
