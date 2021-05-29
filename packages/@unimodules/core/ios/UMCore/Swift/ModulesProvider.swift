
import Foundation

@objc
open class ModulesProvider: NSObject, ModulesProviderProtocol, ModulesProviderObjCProtocol {
  open func exportedModules() -> [AnyModule.Type] {
    return []
  }
}
