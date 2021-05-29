
module Expo
  class Package
    
    attr_reader :name

    attr_reader :version

    attr_reader :pod_name

    attr_reader :podspec_dir

    attr_reader :flags

    attr_reader :swift_modules

    def initialize(json)
      @name = json['packageName']
      @version = json['packageVersion']
      @pod_name = json['podName']
      @podspec_dir = json['podspecDir']
      @flags = json.fetch('flags', {})
      @swift_modules = json.fetch('swiftModules', [])
    end

  end # class Package
end # module Expo
