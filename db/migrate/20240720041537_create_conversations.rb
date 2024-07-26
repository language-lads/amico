# frozen_string_literal: true

class CreateConversations < ActiveRecord::Migration[7.1]
  def change
    create_table :conversations do |t|
      t.jsonb :history, default: []
      t.jsonb :transcription, default: []
      t.references :user, null: false, foreign_key: true
      t.string :language, null: false

      t.timestamps
    end

    reversible do |direction|
      direction.up do
        execute <<~SQL.squish
          CREATE TYPE conversation_status AS ENUM ('initialising', 'in_progress', 'finishing', 'completed', 'error');
        SQL
        add_column :conversations, :status, :conversation_status, null: false, default: 'initialising'
        add_index :conversations, :status
      end
      direction.down do
        remove_column :conversations, :status
        execute <<-SQL.squish
           DROP TYPE conversation_status;
        SQL
      end
    end
  end
end
