import Accelerate
import Foundation

class ImageRequest {
  private let lock = UnfairLock()
  private var _isCancelled = false
  private var callback: ((Result<[String: Int64]?, any Error>) -> Void)?

  var isCancelled: Bool {
    lock.withLock { _isCancelled }
  }

  init(callback: @escaping (Result<[String: Int64]?, any Error>) -> Void) {
    self.callback = callback
  }

  func cancel() {
    let cb = lock.withLock {
      _isCancelled = true
      defer { callback = nil }
      return callback
    }
    onCancel()
    cb?(ImageProcessing.cancelledResult)
  }

  func finish(with result: Result<[String: Int64]?, any Error>) {
    let cb = lock.withLock {
      defer { callback = nil }
      return callback
    }
    cb?(result)
  }

  func onCancel() {}

  func finish(encoding data: Data) {
    let length = data.count
    let pointer = malloc(length)!
    data.copyBytes(to: pointer.assumingMemoryBound(to: UInt8.self), count: length)
    if isCancelled {
      free(pointer)
      return
    }
    finish(with: .success([
      "pointer": Int64(Int(bitPattern: pointer)),
      "length": Int64(length),
    ]))
  }

  func finish(cgImage: CGImage, format: inout vImage_CGImageFormat) throws {
    let buffer = try vImage_Buffer(cgImage: cgImage, format: format)
    if isCancelled {
      buffer.free()
      return
    }
    finish(with: .success([
      "pointer": Int64(Int(bitPattern: buffer.data)),
      "width": Int64(buffer.width),
      "height": Int64(buffer.height),
      "rowBytes": Int64(buffer.rowBytes),
    ]))
  }
}

class RequestRegistry<T: ImageRequest> {
  private let lock = UnfairLock()
  private var requests = [Int64: T]()

  func add(requestId: Int64, request: T) {
    lock.withLock { requests[requestId] = request }
  }

  func get(requestId: Int64) -> T? {
    lock.withLock { requests[requestId] }
  }

  @discardableResult
  func remove(requestId: Int64) -> T? {
    lock.withLock { requests.removeValue(forKey: requestId) }
  }
}
