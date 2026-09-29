import Foundation

class ImageRequest: @unchecked Sendable {
  private struct State: Sendable {
    var isCancelled = false
  }

  let completion: @Sendable (Result<[String: Int64]?, any Error>) -> Void
  private let state: Mutex<State>

  var isCancelled: Bool {
    get {
      state.withLock { $0.isCancelled }
    }
    set {
      state.withLock { $0.isCancelled = newValue }
    }
  }

  init(completion: @escaping @Sendable (Result<[String: Int64]?, any Error>) -> Void) {
    self.state = Mutex(State())
    self.completion = completion
  }

  func cancel() {
    isCancelled = true
  }
}

struct RequestRegistry<T: AnyObject & Sendable>: ~Copyable, Sendable {
  private let requests = Mutex<[Int64: T]>([:])

  func add(requestId: Int64, request: T) {
    requests.withLock { $0[requestId] = request }
  }

  @discardableResult
  func remove(requestId: Int64) -> T? {
    requests.withLock { $0.removeValue(forKey: requestId) }
  }
}
