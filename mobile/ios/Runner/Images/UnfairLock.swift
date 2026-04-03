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
