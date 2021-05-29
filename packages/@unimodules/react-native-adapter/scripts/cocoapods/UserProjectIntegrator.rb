require_relative 'Colors'
require_relative 'Constants'

include Expo

module Pod
  class Installer
    class UserProjectIntegrator
      private

      _original_integrate_user_targets = instance_method(:integrate_user_targets)

      # Integrates the targets of the user projects with the libraries
      # generated from the {Podfile}.
      #
      # @note   {TargetDefinition} without dependencies are skipped prevent
      #         creating empty libraries for targets definitions which are only
      #         wrappers for others.
      #
      # @return [void]
      #
      define_method(:integrate_user_targets) do
        # Call original method first
        results = _original_integrate_user_targets.bind(self).()

        projects = targets_to_integrate.map { |target| target.user_project }.uniq

        projects.each do |project|
          targets = targets_to_integrate.select { |target| target.user_project.equal? project }
          integrate_targets_in_project targets, project
          remove_nils_from_source_files project
        end

        results
      end

      def remove_nils_from_source_files(project)
        # Nils may appear in "Compile Sources" build phase after clearing generated groups
        project.native_targets.each do |native_target|
          native_target.source_build_phase.files.reject! { |file| file.file_ref.nil? }
        end
      end

      def integrate_targets_in_project(targets, project)
        targets_with_swift_modules = targets.select do |target|
          autolinking_manager = target.target_definition.autolinking_manager
          autolinking_manager.present? && autolinking_manager.has_swift_modules?
        end

        # Find existing PBXGroup for generated files
        generated_group = project.main_group.find_subpath(Constants::GENERATED_GROUP_NAME)

        if generated_group.present?
          # If there are no targets with swift modules, clear the generated group and return early
          if targets_with_swift_modules.empty?
            puts "Removing #{generated_group.name} group"
            generated_group.clear
            return results
          end

          # Clear existing groups for targets without swift modules
          generated_group.groups.each do |group|
            if @targets.none? { |target| target.target_definition.name == group.name && targets_with_swift_modules.include?(target) }
              puts "Removing #{Colors.GREEN}#{group.name}#{Colors.RESET} target from #{generated_group.name} group"
              group.clear
            end
          end
        else
          generated_group = project.main_group.new_group(Constants::GENERATED_GROUP_NAME)
        end

        targets_with_swift_modules.sort_by(&:name).each do |target|
          # The user target name (without `Pods-` prefix which is a part of `target.name`)
          target_name = target.target_definition.name

          # PBXNativeTarget of the user target
          native_target = project.native_targets.find { |native_target| native_target.name == target_name }

          # Absolute path to `Pods/Target Support Files/<pods target name>/<modules provider file>` within the project path
          modules_provider_path = File.join(
            target.support_files_dir,
            Constants::MODULES_PROVIDER_FILE_NAME
          )

          # Run `expo-modules-autolinking` command to generate the file.
          target.target_definition.autolinking_manager.generate_package_list(target_name, modules_provider_path)

          # PBXGroup for generated files per target
          generated_target_group = generated_group.find_subpath(target_name, true)

          # PBXGroup uses relative paths, so we need to strip the absolute path
          modules_provider_relative_path = Pathname.new(modules_provider_path).relative_path_from(generated_target_group.real_path).to_s

          if generated_target_group.find_file_by_path(modules_provider_relative_path).nil?
            # Create new PBXFileReference if the modules provider is not in the group yet
            modules_provider_file_reference = generated_target_group.new_file(modules_provider_path)

            if native_target.source_build_phase.files_references.find { |ref| ref.present? && ref.path == modules_provider_relative_path }.nil?
              # Put newly created PBXFileReference to the source files of the native target
              native_target.add_file_references([modules_provider_file_reference])
            end
          end
        end
      end

    end # class UserProjectIntegrator
  end # class Installer
end # module Pod
