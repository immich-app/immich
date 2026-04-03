import Accelerate
import Foundation

// Can be replaced with OSAllocatedUnfairLock when the deployment target is iOS 16+
final class UnfairLock {
  private let _lock: UnsafeMutablePointer<os_unfair_lock>

  init() {
    _lock = .allocate(capacity: 1)
    _lock.initialize(to: os_unfair_lock())
  }

  deinit {
    _lock.deinitialize(count: 1)
    _lock.deallocate()
  }

  func lock() { os_unfair_lock_lock(_lock) }
  func unlock() { os_unfair_lock_unlock(_lock) }
}

class ImageRequest {
  private let lock = UnfairLock()
  private var _isCancelled = false
  private var callback: ((Result<[String: Int64]?, any Error>) -> Void)?

  var isCancelled: Bool {
    lock.lock()
    defer { lock.unlock() }
    return _isCancelled
  }

  init(callback: @escaping (Result<[String: Int64]?, any Error>) -> Void) {
    self.callback = callback
  }

  func cancel() {
    lock.lock()
    _isCancelled = true
    let cb = callback
    callback = nil
    lock.unlock()

    onCancel()
    cb?(ImageProcessing.cancelledResult)
  }

  func finish(with result: Result<[String: Int64]?, any Error>) {
    lock.lock()
    let cb = callback
    callback = nil
    lock.unlock()

    cb?(result)
  }

  func onCancel() {}

  func encodeToPointer(_ data: Data) {
    let length = data.count
    let pointer = malloc(length)!
    data.copyBytes(to: pointer.assumingMemoryBound(to: UInt8.self), count: length)
    if isCancelled {
      free(pointer)
      return finish(with: ImageProcessing.cancelledResult)
    }
    finish(with: .success([
      "pointer": Int64(Int(bitPattern: pointer)),
      "length": Int64(length),
    ]))
  }

  func cgImageToPointer(_ cgImage: CGImage, format: vImage_CGImageFormat) throws {
    var fmt = format
    let buffer = try vImage_Buffer(cgImage: cgImage, format: fmt)
    if isCancelled {
      buffer.free()
      return finish(with: ImageProcessing.cancelledResult)
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
    lock.lock()
    requests[requestId] = request
    lock.unlock()
  }

  @discardableResult
  func remove(requestId: Int64) -> T? {
    lock.lock()
    defer { lock.unlock() }
    return requests.removeValue(forKey: requestId)
  }

  func cancel(requestId: Int64) {
    remove(requestId: requestId)?.cancel()
  }
}

enum ImageProcessing {
  static let queue = {
    let q = OperationQueue()
    q.name = "thumbnail.processing"
    q.qualityOfService = .userInitiated
    q.maxConcurrentOperationCount = ProcessInfo.processInfo.activeProcessorCount * 2
    return q
  }()
  static let cancelledResult = Result<[String: Int64]?, any Error>.success(nil)
}
