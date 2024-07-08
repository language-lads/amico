# frozen_string_literal: true

class AddLanguagePreferenceToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :language, :string, default: 'en'
  end
end
