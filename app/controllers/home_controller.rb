# frozen_string_literal: true

class HomeController < ApplicationController
  before_action :authenticate_user!

  def index; end

  def change_language
    current_user.update(language: params[:language])

    respond_to do |format|
      format.html { redirect_back_or_to home_index_path }
      format.json { head :no_content }
    end
  end
end
