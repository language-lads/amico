# frozen_string_literal: true

# Add your own tasks in files placed in lib/tasks ending in .rake,
# for example lib/tasks/capistrano.rake, and they will automatically be available to Rake.

require_relative 'config/application'

# Make sure to run `bundle install` before running any of the tasks

task dev: :environment do
  sh 'bundle exec rails db:migrate'
  sh 'bundle exec rails server'
end

task lint: :environment do
  sh 'bundle exec rubocop' # Run with --autocorrect-all to fix offenses
end

task format: :environment do
  sh 'bundle exec rubocop --fix-layout --autocorrect-all || true'
  sh 'find app -name "*.html.erb" -exec bundle exec erb-formatter --write {} \;'
end

Rails.application.load_tasks
