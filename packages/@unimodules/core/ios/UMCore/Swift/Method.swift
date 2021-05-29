
public struct Method<Args, ReturnType>: AnyMethod {
  public typealias MethodType = (Args) -> ReturnType

  public let name: String

  public let argumentsCount: Int

  public var queue: DispatchQueue?

  let closure: MethodType
  let takesPromise: Bool

  public init(_ name: String, closure: @escaping MethodType) {
    let argsComponents = Self.argsComponents()

    self.name = name
    self.closure = closure
    self.takesPromise = argsComponents.last == "Promise"
    self.argumentsCount = argsComponents.count - (takesPromise ? 1 : 0)
  }

  public init(_ name: String, queue: DispatchQueue, closure: @escaping MethodType) {
    self.init(name, closure: closure)
    self.queue = queue
  }

  public func call(args: Any, promise: Promise) {
    guard let array = args as? [Any] else {
      promise.resolve(closure(args as! Args))
      return
    }

    do {
      let arrayWithPromise = array + (takesPromise ? [promise] : [])
      let tuple: Args = try Conversions.arrayToTuple(arrayWithPromise) as! Args
      let returnedValue = closure(tuple)

      // Immediately resolve with the returned value when the method doesn't take the promise as an argument.
      if !takesPromise {
        promise.resolve(returnedValue)
      }
    } catch let error as Conversions.Errors.ArrayTooLong {
      promise.reject("More than \(error.limit) arguments is not supported right now. Got \(error.size).", error)
    } catch let error {
      promise.reject(error)
    }
  }

  static func argsComponents() -> [String] {
    var str = String(describing: Args.self)
    if str.hasPrefix("(") {
      str = String(str.dropFirst())
    }
    if str.hasSuffix(")") {
      str = String(str.dropLast())
    }
    return str.components(separatedBy: ", ").filter { !$0.isEmpty }
  }
}
