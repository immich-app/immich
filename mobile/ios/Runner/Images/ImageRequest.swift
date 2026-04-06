import Accelerate
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
    guard let cb = state.withLock({
      $0.isCancelled = true
      defer { $0.callback = nil }
      return $0.callback
    }) else { return }
    onCancel()
    cb(ImageProcessing.cancelledResult)
  }

  /// Delivers the result to the callback. Returns true if the callback was called, false if it was already consumed.
  @discardableResult
  func finish(with result: Result<[String: Int64]?, any Error>) -> Bool {
    guard let cb = state.withLock({
      defer { $0.callback = nil }
      return $0.callback
    }) else { return false }
    cb(result)
    return true
  }

  func onCancel() {}

  func finish(encoding data: Data) {
    let length = data.count
    let pointer = malloc(length)!
    data.copyBytes(to: pointer.assumingMemoryBound(to: UInt8.self), count: length)
    if !finish(with: .success([
      "pointer": Int64(Int(bitPattern: pointer)),
      "length": Int64(length),
    ])) {
      free(pointer)
    }
  }

  func finish(cgImage: CGImage, format: inout vImage_CGImageFormat) throws {
    let buffer = try vImage_Buffer(cgImage: cgImage, format: format)
    if !finish(with: .success([
      "pointer": Int64(Int(bitPattern: buffer.data)),
      "width": Int64(buffer.width),
      "height": Int64(buffer.height),
      "rowBytes": Int64(buffer.rowBytes),
    ])) {
      buffer.free()
    }
  }
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
