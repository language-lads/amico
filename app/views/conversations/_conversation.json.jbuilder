json.extract! conversation, :id, :history, :audio, :user_id, :created_at, :updated_at, :language, :status
json.url conversation_url(conversation, format: :json)
json.audio url_for(conversation.audio)
