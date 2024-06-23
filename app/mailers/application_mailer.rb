# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: 'amico@tombarone.net'
  layout 'mailer'
end
