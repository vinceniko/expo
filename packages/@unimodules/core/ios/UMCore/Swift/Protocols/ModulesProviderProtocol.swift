
import Foundation

@objc
public protocol ModulesProviderObjCProtocol {}

public protocol ModulesProviderProtocol: ModulesProviderObjCProtocol {
  func exportedModules() -> [AnyModule.Type]
}
