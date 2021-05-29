require 'json'
require 'pathname'

require_relative 'cocoapods/Colors'
require_relative 'cocoapods/AutolinkingManager'
require_relative 'cocoapods/TargetDefinition'
require_relative 'cocoapods/UserProjectIntegrator'

def use_expo_modules!(options = {})
  # When run from the Podfile, `self` points to Pod::Podfile object

  if @current_target_definition.autolinking_manager.present?
    puts "#{Colors.RED}Expo modules are already being used in this target definition#{Colors.RESET}"
    return
  end

  @current_target_definition.autolinking_manager = Expo::AutolinkingManager.new(self, @current_target_definition, options).use_expo_modules!
end
