# frozen_string_literal: true

class HomeController < ApplicationController
  before_action :authenticate_user!

  def index; end

  def change_language
    current_user.update(language: params[:language])
  end
end
