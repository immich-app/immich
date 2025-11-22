import SQLiteData

protocol StoreProtocol {
  func get<T: StoreConvertible<Int>>(_ key: StoreKey.Typed<T>) throws -> T?
  func get<T: StoreConvertible<String>>(_ key: StoreKey.Typed<T>) throws -> T?
  func set<T: StoreConvertible<Int>>(_ key: StoreKey.Typed<T>, value: T) throws
  func set<T: StoreConvertible<String>>(_ key: StoreKey.Typed<T>, value: T) throws
  func invalidateCache()
}

protocol StoreConvertible<StorageType> {
  associatedtype StorageType
  static var cacheKeyPath: ReferenceWritableKeyPath<StoreCache, [StoreKey: Self]> { get }
  static func fromValue(_ value: StorageType) throws(StoreError) -> Self
  static func toValue(_ value: Self) throws(StoreError) -> StorageType
}

final class StoreRepository: StoreProtocol {
  private let db: DatabasePool
  private static let cache = StoreCache()
  private static var lock = os_unfair_lock()

  init(db: DatabasePool) {
    self.db = db
  }

  func get<T: StoreConvertible<Int>>(_ key: StoreKey.Typed<T>) throws -> T? {
    os_unfair_lock_lock(&Self.lock)
    defer { os_unfair_lock_unlock(&Self.lock) }
    let cached = Self.cache.get(key)
    if _fastPath(cached != nil) { return cached! }
    return try db.read { conn in
      let query = Store.select(\.intValue).where { $0.id.eq(key.rawValue) }
      if let value = try query.fetchOne(conn) ?? nil {
        let converted = try T.fromValue(value)
        Self.cache.set(key, value: converted)
        return converted
      }
      return nil
    }
  }

  func get<T: StoreConvertible<String>>(_ key: StoreKey.Typed<T>) throws -> T? {
    os_unfair_lock_lock(&Self.lock)
    defer { os_unfair_lock_unlock(&Self.lock) }
    let cached = Self.cache.get(key)
    if _fastPath(cached != nil) { return cached! }
    return try db.read { conn in
      let query = Store.select(\.stringValue).where { $0.id.eq(key.rawValue) }
      if let value = try query.fetchOne(conn) ?? nil {
        let converted = try T.fromValue(value)
        Self.cache.set(key, value: converted)
        return converted
      }
      return nil
    }
  }

  func set<T: StoreConvertible<Int>>(_ key: StoreKey.Typed<T>, value: T) throws {
    os_unfair_lock_lock(&Self.lock)
    defer { os_unfair_lock_unlock(&Self.lock) }
    let converted = try T.toValue(value)
    try db.write { conn in
      try Store.upsert { Store(id: key.rawValue, stringValue: nil, intValue: converted) }.execute(conn)
    }
    Self.cache.set(key, value: value)
  }

  func set<T: StoreConvertible<String>>(_ key: StoreKey.Typed<T>, value: T) throws {
    os_unfair_lock_lock(&Self.lock)
    defer { os_unfair_lock_unlock(&Self.lock) }
    let converted = try T.toValue(value)
    try db.write { conn in
      try Store.upsert { Store(id: key.rawValue, stringValue: converted, intValue: nil) }.execute(conn)
    }
    Self.cache.set(key, value: value)
  }

  func invalidateCache() {
    Self.cache.reset()
  }
}

enum StoreError: Error {
  case invalidJSON(String)
  case invalidURL(String)
  case encodingFailed
  case notFound
}

extension StoreConvertible {
  fileprivate static func get(_ cache: StoreCache, key: StoreKey) -> Self? {
    return cache[keyPath: cacheKeyPath][key]
  }

  fileprivate static func set(_ cache: StoreCache, key: StoreKey, value: Self?) {
    cache[keyPath: cacheKeyPath][key] = value
  }

  fileprivate static func reset(_ cache: StoreCache) {
    cache.reset()
  }
}

final class StoreCache {
  fileprivate var intCache: [StoreKey: Int] = [:]
  fileprivate var boolCache: [StoreKey: Bool] = [:]
  fileprivate var dateCache: [StoreKey: Date] = [:]
  fileprivate var stringCache: [StoreKey: String] = [:]
  fileprivate var urlCache: [StoreKey: URL] = [:]
  fileprivate var endpointArrayCache: [StoreKey: [Endpoint]] = [:]
  fileprivate var stringDictCache: [StoreKey: [String: String]] = [:]

  func get<T: StoreConvertible>(_ key: StoreKey.Typed<T>) -> T? {
    return T.get(self, key: key.rawValue)
  }

  func set<T: StoreConvertible>(_ key: StoreKey.Typed<T>, value: T?) {
    return T.set(self, key: key.rawValue, value: value)
  }

  func reset() {
    intCache.removeAll(keepingCapacity: true)
    boolCache.removeAll(keepingCapacity: true)
    dateCache.removeAll(keepingCapacity: true)
    stringCache.removeAll(keepingCapacity: true)
    urlCache.removeAll(keepingCapacity: true)
    endpointArrayCache.removeAll(keepingCapacity: true)
    stringDictCache.removeAll(keepingCapacity: true)
  }
}

extension Int: StoreConvertible {
  static let cacheKeyPath = \StoreCache.intCache
  static func fromValue(_ value: Int) -> Int { value }
  static func toValue(_ value: Int) -> Int { value }
}

extension Bool: StoreConvertible {
  static let cacheKeyPath = \StoreCache.boolCache
  static func fromValue(_ value: Int) -> Bool { value == 1 }
  static func toValue(_ value: Bool) -> Int { value ? 1 : 0 }
}

extension Date: StoreConvertible {
  static let cacheKeyPath = \StoreCache.dateCache
  static func fromValue(_ value: Int) -> Date { Date(timeIntervalSince1970: TimeInterval(value) / 1000) }
  static func toValue(_ value: Date) -> Int { Int(value.timeIntervalSince1970 * 1000) }
}

extension String: StoreConvertible {
  static let cacheKeyPath = \StoreCache.stringCache
  static func fromValue(_ value: String) -> String { value }
  static func toValue(_ value: String) -> String { value }
}

extension URL: StoreConvertible {
  static let cacheKeyPath = \StoreCache.urlCache
  static func fromValue(_ value: String) throws(StoreError) -> URL {
    guard let url = URL(string: value) else {
      throw StoreError.invalidURL(value)
    }
    return url
  }
  static func toValue(_ value: URL) -> String { value.absoluteString }
}

extension StoreConvertible<String> where Self: Codable {
  static var jsonDecoder: JSONDecoder { JSONDecoder() }
  static var jsonEncoder: JSONEncoder { JSONEncoder() }

  static func fromValue(_ value: String) throws(StoreError) -> Self {
    do {
      return try jsonDecoder.decode(Self.self, from: Data(value.utf8))
    } catch {
      throw StoreError.invalidJSON(value)
    }
  }

  static func toValue(_ value: Self) throws(StoreError) -> String {
    let encoded: Data
    do {
      encoded = try jsonEncoder.encode(value)
    } catch {
      throw StoreError.encodingFailed
    }

    guard let string = String(data: encoded, encoding: .utf8) else {
      throw StoreError.encodingFailed
    }
    return string
  }
}

extension Array: StoreConvertible where Element == Endpoint {
  static let cacheKeyPath = \StoreCache.endpointArrayCache
  typealias StorageType = String
}

extension Dictionary: StoreConvertible where Key == String, Value == String {
  static let cacheKeyPath = \StoreCache.stringDictCache
  typealias StorageType = String
}
