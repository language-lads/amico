# frozen_string_literal: true

# Add your own tasks in files placed in lib/tasks ending in .rake,
# for example lib/tasks/capistrano.rake, and they will automatically be available to Rake.

require_relative 'config/application'
Rails.application.load_tasks

# Make sure to run `bundle install` before running any of the tasks
task install: :environment do
  sh 'bundle install'
  sh 'yarn install'
  sh 'bundle exec rails db:prepare'
  sh 'bundle exec rails db:migrate'
end

task dev: %i[environment clean install] do
  sh 'bundle exec bin/dev'
end

task lint: :environment do
  sh 'bundle exec tapioca dsl' # Make sure RBI files are up to date
  sh 'bundle exec srb typecheck' # Type check with Sorbet
  sh 'bundle exec rubocop' # Run with --autocorrect-all to fix offenses
  sh 'yarn tsc'
end

task format: :environment do
  sh 'bundle exec rubocop --autocorrect-all --fail-level F'
  sh 'bundle exec rubocop --fix-layout --autocorrect-all --fail-level F'
  sh 'find app -name "*.html.erb" -exec bundle exec erb-formatter --write {} \;'
end

task check_diff: :environment do
  sh 'git diff --exit-code'
end

Rake::Task['test'].clear # Override the default test task
task test: :environment do
  sh 'bundle exec rails test:all' # Run all rails unit and system tests
end

task clean: :environment do
  # Remove all empty directories in /storage
  Dir.glob(Rails.root.join('storage/**/*').to_s).sort_by(&:length).reverse.each do |x|
    Dir.rmdir(x) if File.directory?(x) && Dir.empty?(x)
  end
end

task ci: %i[install format lint test check_diff]
task precommit: %i[format lint test clean]
