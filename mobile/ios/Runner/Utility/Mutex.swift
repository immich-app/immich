import Darwin

// Can be replaced with std Mutex when the deployment target is iOS 18+
struct Mutex<Value: ~Copyable>: ~Copyable, @unchecked Sendable {
  struct _Buffer: ~Copyable {
    var lock: os_unfair_lock = .init()
    var value: Value

    init(value: consuming Value) {
      self.value = value
    }

    deinit {}
  }

  let _buffer: UnsafeMutablePointer<_Buffer>

  init(_ initialValue: consuming sending Value) {
    _buffer = .allocate(capacity: 1)
    _buffer.initialize(to: _Buffer(value: initialValue))
  }

  deinit {
    _buffer.deinitialize(count: 1)
    _buffer.deallocate()
  }

  @discardableResult
  borrowing func withLock<Result: ~Copyable, E: Error>(
    _ body: (inout sending Value) throws(E) -> sending Result
  ) throws(E) -> sending Result {
    os_unfair_lock_lock(&_buffer.pointee.lock)
    defer { os_unfair_lock_unlock(&_buffer.pointee.lock) }
    return try body(&_buffer.pointee.value)
  }
}

// Can be replaced with OSAllocatedUnfairLock when the deployment target is iOS 16+
typealias UnfairLock = Mutex<Void>

extension Mutex where Value == Void {
  init() {
    self.init(())
  }

  @discardableResult
  borrowing func withLock<Result: ~Copyable, E: Error>(
    _ body: () throws(E) -> sending Result
  ) throws(E) -> sending Result {
    os_unfair_lock_lock(&_buffer.pointee.lock)
    defer { os_unfair_lock_unlock(&_buffer.pointee.lock) }
    return try body()
  }
}
