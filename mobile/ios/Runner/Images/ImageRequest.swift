import Foundation

class RequestRegistry<T: AnyObject> {
  private let lock = UnfairLock()
  private var requests = [Int64: T]()

  func add(requestId: Int64, request: T) {
    lock.withLock { requests[requestId] = request }
  }

  @discardableResult
  func remove(requestId: Int64) -> T? {
    lock.withLock { requests.removeValue(forKey: requestId) }
  }
}
