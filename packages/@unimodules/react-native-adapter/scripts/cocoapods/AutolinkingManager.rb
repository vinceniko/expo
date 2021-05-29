require_relative 'Colors'
require_relative 'Constants'
require_relative 'Package'

module Expo
  class AutolinkingManager
    def initialize(podfile, target_definition, options)
      @podfile = podfile
      @target_definition = target_definition
      @options = options
      @packages = resolve()['modules'].map { |json_package| Package.new(json_package) }
    end

    def use_expo_modules!
      if has_packages?
        return
      end

      global_flags = @options.fetch(:flags, {})
      tests = @options.fetch(:tests, [])

      project_directory = Pod::Config.instance.project_root

      puts "Using expo modules"

      @packages.each { |package|
        # The module can already be added to the target, in which case we can just skip it.
        # This allows us to add a pod before `use_expo_modules` to provide custom flags.
        if @target_definition.dependencies.any? { |dependency| dependency.name == package.pod_name }
          puts "— #{Colors.GREEN}#{package.name}#{Colors.RESET} #{Colors.YELLOW}is already added to the target#{Colors.RESET}"
          next
        end

        pod_options = {
          :path => Pathname.new(package.podspec_dir).relative_path_from(project_directory).to_path,
          :testspecs => tests.include?(package.name) ? ['Tests'] : []
        }.merge(global_flags, package.flags)

        # Install the pod.
        @podfile.pod package.pod_name, pod_options

        # Can remove this once we move all the interfaces into the core.
        next if package.pod_name.end_with?('Interface')

        puts "— #{Colors.GREEN}#{package.name}#{Colors.RESET} (#{package.version})"
      }
      self
    end

    def generate_package_list(target_name, target_path)
      puts "Generating package list for target #{Colors.GREEN}#{target_name}#{Colors.RESET}"
      IO.popen(generate_package_list_command_args(target_path)) do |data|
      end
    end

    def has_packages?
      @packages.empty?
    end

    def has_swift_modules?
      @packages.find { |package| package.swift_modules.any? }.present?
    end

    def packages_with_swift_modules
      @packages.select { |package| package.swift_modules.any? }
    end

    private

    def resolve
      json = []

      IO.popen(resolve_command_args) do |data|
        while line = data.gets
          json << line
        end
      end

      begin
        JSON.parse(json.join())
      rescue => error
        raise "Couldn't parse JSON coming from `expo-modules-autolinking` command:\n#{error}"
      end
    end

    def node_command_args(command_name)
      search_paths = @options.fetch(:searchPaths, @options.fetch(:modules_paths, nil))
      ignore_paths = @options.fetch(:ignorePaths, nil)
      exclude = @options.fetch(:exclude, [])

      args = [
        'node',
        '--eval',
        'require(\'expo-modules-autolinking\')(process.argv.slice(1))',
        command_name,
        '--platform',
        'ios'
      ]

      if !search_paths.nil? && !search_paths.empty?
        args.concat(searchPaths)
      end

      if !ignore_paths.nil? && !ignore_paths.empty?
        args.concat(['--ignore-paths'], ignore_paths)
      end

      if !exclude.nil? && !exclude.empty?
        args.concat(['--exclude'], exclude)
      end

      args
    end

    def resolve_command_args
      node_command_args('resolve').concat(['--json'])
    end

    def generate_package_list_command_args(target_path)
      node_command_args('generate-package-list').concat([
        '--target',
        target_path
      ])
    end

  end # class AutolinkingManager
end # module Expo
