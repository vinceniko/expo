
/**
 A protocol for any type-erased module that provides methods used by the core.
 */
public protocol AnyModule: AnyObject {
  /**
   Handy alias for the dictionary of constants.
   */
  typealias Constants = [String : Any?]

  /**
   Returns the name of the module that is exported to the JavaScript world.
   */
  var name: String? { get }

  /**
   The default initializer, must be public.
   */
  init()

  /**
   Returns a dictionary of constants that are synchronously accessible in JavaScript.
   */
  func constants() -> Constants

  /**
   A function returning an array of methods to export to JavaScript.
   */
  func methods() -> [AnyMethod]
}
