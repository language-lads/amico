# frozen_string_literal: true

# Add your own tasks in files placed in lib/tasks ending in .rake,
# for example lib/tasks/capistrano.rake, and they will automatically be available to Rake.

require_relative 'config/application'

# Make sure to run `bundle install` before running any of the tasks
task install: :environment do
  sh 'bundle install'
  sh 'yarn install'
end

task dev: %i[environment install cleanup] do
  sh 'bundle exec rails db:migrate'
  sh 'bundle exec bin/dev'
end

task lint: :environment do
  sh 'bundle exec rubocop' # Run with --autocorrect-all to fix offenses
  sh 'yarn tsc'
end

task format: :environment do
  sh 'bundle exec rubocop --autocorrect-all --fail-level F'
  sh 'bundle exec rubocop --fix-layout --autocorrect-all --fail-level F'
  sh 'find app -name "*.html.erb" -exec bundle exec erb-formatter --write {} \;'
end

task check_format: %i[environment format] do
  sh 'git diff --exit-code'
end

task testall: %i[environment] do
  sh 'bundle exec rails test'
end

task precommit: %i[environment format lint testall]

task cleanup: :environment do
  # Remove all empty directories in /storage
  Dir.glob(Rails.root.join('storage/**/*').to_s).sort_by(&:length).reverse.each do |x|
    Dir.rmdir(x) if File.directory?(x) && Dir.empty?(x)
  end
end

Rails.application.load_tasks
