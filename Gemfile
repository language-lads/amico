# frozen_string_literal: true

source 'https://rubygems.org'

ruby '3.3.4'

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem 'rails', '~> 7.1.3', '>= 7.1.3.4'

# The original asset pipeline for Rails [https://github.com/rails/sprockets-rails]
gem 'sprockets-rails'

# Use postgresql as the database for Active Record
gem 'pg', '~> 1.1'

# Use the Puma web server [https://github.com/puma/puma]
gem 'puma', '>= 5.0'

# Bundle and transpile JavaScript [https://github.com/rails/jsbundling-rails]
gem 'jsbundling-rails'

# Hotwire's SPA-like page accelerator [https://turbo.hotwired.dev]
gem 'turbo-rails'

# Hotwire's modest JavaScript framework [https://stimulus.hotwired.dev]
gem 'stimulus-rails'

# Bundle and process CSS [https://github.com/rails/cssbundling-rails]
gem 'cssbundling-rails'

# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem 'jbuilder'

# Use Redis adapter to run Action Cable in production
gem 'redis', '>= 4.0.2'

# Use Kredis to get higher-level data types in Redis [https://github.com/rails/kredis]
# gem "kredis"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
# gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: %i[windows jruby]

# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
# gem "image_processing", "~> 1.2"

# User management [https://github.com/heartcombo/devise]
gem 'devise'

# Postgres backed job queue [https://github.com/bensheldon/good_job]
gem 'good_job'

# Omniauth providers [https://github.com/omniauth/omniauth/wiki/List-of-Strategies]
gem 'omniauth-google-oauth2'
gem 'omniauth-rails_csrf_protection'

# Client side datetime timezone display
gem 'local_time'

# For doing ajaxy stuff [https://github.com/rails/requestjs-rails]
gem 'requestjs-rails'

# For working with wav files [https://github.com/jstrait/wavefile]
gem 'wavefile'

# For ActiveStorage on Google Cloud [https://github.com/googleapis/google-cloud-ruby/tree/main/google-cloud-storage]
gem 'google-cloud-storage'

# For interacting with the websockets [https://github.com/faye/faye-websocket-ruby]
gem 'faye-websocket'

# For talking to OpenAI
gem 'ruby-openai'

# For making easy post requests [https://github.com/httprb/http]
gem 'http'

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem 'debug', platforms: %i[mri windows]
  # For linting and formatting [https://github.com/rubocop/rubocop]
  gem 'rubocop'
  gem 'rubocop-capybara', require: false
  gem 'rubocop-rails', require: false

  # For formatting ERB code [https://github.com/nebulab/erb-formatter]
  gem 'erb-formatter'

  # For running the dev server
  gem 'foreman'
end

group :development do
  # Use console on exceptions pages [https://github.com/rails/web-console]
  gem 'web-console'

  # For viewing emails in development [https://github.com/ryanb/letter_opener]
  gem 'letter_opener'

  # Add speed badges [https://github.com/MiniProfiler/rack-mini-profiler]
  # gem "rack-mini-profiler"

  # Speed up commands on slow machines / big apps [https://github.com/rails/spring]
  # gem "spring"
end

group :test do
  # Use system testing [https://guides.rubyonrails.org/testing.html#system-testing]
  gem 'capybara'
  gem 'selenium-webdriver'
end

# Typing and static analysis
gem 'sorbet', group: :development
gem 'sorbet-runtime'
gem 'tapioca', require: false, group: %i[development test]
