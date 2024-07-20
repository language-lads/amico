# frozen_string_literal: true

# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Add default Users for myself and Bel
User.create(email: 'admin@languagelads.com',
            password: 'QTVE9s%Y!!tBfa',
            password_confirmation: 'QTVE9s%Y!!tBfa',
            admin: true,
            language: 'en',
            confirmed_at: Time.zone.now)
