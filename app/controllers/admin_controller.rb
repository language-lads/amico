# frozen_string_literal: true

class AdminController < ApplicationController
  before_action :authenticate_user!
  before_action :admin_only

  def index
    @users = User.all
  end

  def destroy_user
    user = User.find(params[:id])
    user.destroy
    redirect_to admin_index_path, notice: t('.user_deleted')
  end

  def toggle_admin
    user = User.find(params[:id])
    user.update(admin: !user.admin?)
    user.save
    redirect_to admin_index_path, notice: t('.toggle_admin')
  end

  private

  def admin_only
    return if current_user.admin?

    redirect_to root_path, alert: t('.admin_only')
  end
end
