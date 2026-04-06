import Foundation

class ImageRequest {
  private struct State {
    var isCancelled = false
    var callback: ((Result<[String: Int64]?, any Error>) -> Void)?
  }

  private let state: Mutex<State>

  var isCancelled: Bool {
    state.withLock { $0.isCancelled }
  }

  init(callback: @escaping (Result<[String: Int64]?, any Error>) -> Void) {
    self.state = Mutex(State(callback: callback))
  }

  func cancel() {
    let cb = state.withLock { state in
      state.isCancelled = true
      defer { state.callback = nil }
      return state.callback
    }
    guard let cb else { return }
    onCancel()
    cb(ImageProcessing.cancelledResult)
  }

  /// Delivers the result to the callback. Returns true if the callback was called, false if it was already consumed.
  @discardableResult
  func finish(with result: Result<[String: Int64]?, any Error>) -> Bool {
    let cb = state.withLock { state in
      defer { state.callback = nil }
      return state.callback
    }
    guard let cb else { return false }
    cb(result)
    return true
  }

  func onCancel() {}
}

class RequestRegistry<T: ImageRequest> {
  private let requests = Mutex<[Int64: T]>([:])

  func add(requestId: Int64, request: T) {
    requests.withLock { $0[requestId] = request }
  }

  func get(requestId: Int64) -> T? {
    requests.withLock { $0[requestId] }
  }

  @discardableResult
  func remove(requestId: Int64) -> T? {
    requests.withLock { $0.removeValue(forKey: requestId) }
  }
}
