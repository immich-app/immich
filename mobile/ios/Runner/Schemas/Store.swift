import SQLiteData

enum StoreError: Error {
  case invalidJSON(String)
  case invalidURL(String)
  case encodingFailed
}

protocol StoreConvertible {
  associatedtype StorageType
  static func fromValue(_ value: StorageType) throws(StoreError) -> Self
  static func toValue(_ value: Self) throws(StoreError) -> StorageType
}

extension Int: StoreConvertible {
  static func fromValue(_ value: Int) -> Int { value }
  static func toValue(_ value: Int) -> Int { value }
}

extension Bool: StoreConvertible {
  static func fromValue(_ value: Int) -> Bool { value == 1 }
  static func toValue(_ value: Bool) -> Int { value ? 1 : 0 }
}

extension Date: StoreConvertible {
  static func fromValue(_ value: Int) -> Date { Date(timeIntervalSince1970: TimeInterval(value) / 1000) }
  static func toValue(_ value: Date) -> Int { Int(value.timeIntervalSince1970 * 1000) }
}

extension String: StoreConvertible {
  static func fromValue(_ value: String) -> String { value }
  static func toValue(_ value: String) -> String { value }
}

extension URL: StoreConvertible {
  static func fromValue(_ value: String) throws(StoreError) -> URL {
    guard let url = URL(string: value) else {
      throw StoreError.invalidURL(value)
    }
    return url
  }
  static func toValue(_ value: URL) -> String { value.absoluteString }
}

extension StoreConvertible where Self: Codable, StorageType == String {
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

extension Array: StoreConvertible where Element: Codable {
  typealias StorageType = String
}

extension Dictionary: StoreConvertible where Key == String, Value: Codable {
  typealias StorageType = String
}

class StoreRepository {
  private let db: DatabasePool

  init(db: DatabasePool) {
    self.db = db
  }

  func get<T: StoreConvertible>(_ key: StoreKey.Typed<T>) throws -> T? where T.StorageType == Int {
    let query = Store.select(\.intValue).where { $0.id.eq(key.rawValue) }
    if let value = try db.read({ conn in try query.fetchOne(conn) }) ?? nil {
      return try T.fromValue(value)
    }
    return nil
  }

  func get<T: StoreConvertible>(_ key: StoreKey.Typed<T>) throws -> T? where T.StorageType == String {
    let query = Store.select(\.stringValue).where { $0.id.eq(key.rawValue) }
    if let value = try db.read({ conn in try query.fetchOne(conn) }) ?? nil {
      return try T.fromValue(value)
    }
    return nil
  }

  func get<T: StoreConvertible>(_ key: StoreKey.Typed<T>) async throws -> T? where T.StorageType == Int {
    let query = Store.select(\.intValue).where { $0.id.eq(key.rawValue) }
    if let value = try await db.read({ conn in try query.fetchOne(conn) }) ?? nil {
      return try T.fromValue(value)
    }
    return nil
  }

  func get<T: StoreConvertible>(_ key: StoreKey.Typed<T>) async throws -> T? where T.StorageType == String {
    let query = Store.select(\.stringValue).where { $0.id.eq(key.rawValue) }
    if let value = try await db.read({ conn in try query.fetchOne(conn) }) ?? nil {
      return try T.fromValue(value)
    }
    return nil
  }

  func set<T: StoreConvertible>(_ key: StoreKey.Typed<T>, value: T) throws where T.StorageType == Int {
    let value = try T.toValue(value)
    try db.write { conn in
      try Store.upsert { Store(id: key.rawValue, stringValue: nil, intValue: value) }.execute(conn)
    }
  }

  func set<T: StoreConvertible>(_ key: StoreKey.Typed<T>, value: T) throws where T.StorageType == String {
    let value = try T.toValue(value)
    try db.write { conn in
      try Store.upsert { Store(id: key.rawValue, stringValue: value, intValue: nil) }.execute(conn)
    }
  }

  func set<T: StoreConvertible>(_ key: StoreKey.Typed<T>, value: T) async throws where T.StorageType == Int {
    let value = try T.toValue(value)
    try await db.write { conn in
      try Store.upsert { Store(id: key.rawValue, stringValue: nil, intValue: value) }.execute(conn)
    }
  }

  func set<T: StoreConvertible>(_ key: StoreKey.Typed<T>, value: T) async throws where T.StorageType == String {
    let value = try T.toValue(value)
    try await db.write { conn in
      try Store.upsert { Store(id: key.rawValue, stringValue: value, intValue: nil) }.execute(conn)
    }
  }
}
