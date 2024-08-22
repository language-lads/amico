# frozen_string_literal: true

class ApplicationController < ActionController::Base
  around_action :switch_locale

  def after_sign_out_path_for(_resource_or_scope)
    new_user_session_path
  end

  def switch_locale(&)
    locale = current_user.try(:language) || I18n.default_locale
    I18n.with_locale(locale, &)
  end
end
