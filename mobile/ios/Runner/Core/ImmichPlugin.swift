class ImmichPlugin: NSObject {
  var detached: Bool

  override init() {
    detached = false
    super.init()
  }

  func detachFromEngine() {
    self.detached = true
  }

  func completeWhenActive<T>(for completion: @escaping (T) -> Void, with value: T) {
    guard !self.detached else { return }
    completion(value)
  }
}

@inline(__always)
func dPrint(_ item: Any) {
  #if DEBUG
    print(item)
  #endif
}
