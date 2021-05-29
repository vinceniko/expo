
open class Module: AnyModule {
  public let name: String? = nil

  required public init() {}

  open func constants() -> Constants {
    [:]
  }

  open func methods() -> [AnyMethod] {
    []
  }
}
