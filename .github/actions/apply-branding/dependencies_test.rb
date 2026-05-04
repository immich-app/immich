#!/usr/bin/env ruby
# frozen_string_literal: true

require 'yaml'

action_path = File.expand_path('action.yml', __dir__)
action = YAML.load_file(action_path)
install_step = action.fetch('runs').fetch('steps').find { |step| step['name'] == 'Install dependencies' }

abort('Install dependencies step is missing') unless install_step

run_script = install_step.fetch('run')
failures = []

unless run_script.match?(/brew install[^\n]*imagemagick/)
  failures << 'macOS dependency install must include imagemagick'
end

unless run_script.include?('packages+=(imagemagick)') && run_script.include?('apt-get install -y "${packages[@]}"')
  failures << 'Linux dependency install must add and install the imagemagick package'
end

unless run_script.include?('command -v identify')
  failures << 'Linux dependency check must account for ImageMagick identify, used by verify-mobile-assets.sh'
end

unless run_script.include?('command -v convert') || run_script.include?('command -v magick')
  failures << 'Linux dependency check must account for convert or magick, used by apply-branding.sh'
end

abort(failures.join("\n")) unless failures.empty?
