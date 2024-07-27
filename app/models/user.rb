# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :lockable, :timeoutable, :trackable,
         :omniauthable, omniauth_providers: %i[google_oauth2]

  # If a user is deleted, we want to keep all the conversations
  has_many :conversations, dependent: :nullify

  LANGUAGE_DETAILS = [{
    code: 'en',
    name: 'English',
    english_name: 'English',
    flag_code: 'gb'
  }, {
    code: 'it',
    name: 'Italiano',
    english_name: 'Italian', # Needed when we do system prompts for the LLMs
    flag_code: 'it'
  }, {
    code: 'de',
    name: 'Deutsch',
    english_name: 'German',
    flag_code: 'de'
  }, {
    code: 'fr',
    name: 'Français',
    english_name: 'French',
    flag_code: 'fr'
  }].freeze

  def self.from_omniauth(auth)
    find_or_create_by(provider: auth.provider, uid: auth.uid) do |user|
      user.email = auth.info.email
      user.password = Devise.friendly_token[0, 20]
      # user.name = auth.info.name   # assuming the user model has a name
      # user.image = auth.info.image # assuming the user model has an image

      # If you are using confirmable and the provider(s) you use validate emails,
      # uncomment the line below to skip the confirmation emails.
      user.skip_confirmation!
    end
  end

  def language_details
    LANGUAGE_DETAILS.find { |l| l[:code] == language }
  end
end
