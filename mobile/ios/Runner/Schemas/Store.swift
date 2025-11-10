import SQLiteData

protocol StoreConvertible {
  associatedtype StorageType
  static func fromValue(_ value: StorageType) -> Self
  static func toValue(_ value: Self) -> StorageType
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
  static func fromValue(_ value: String) -> URL { URL(string: value)! }
  static func toValue(_ value: URL) -> String { value.path }
}

class StoreRepository {
  private let db: DatabasePool

  init(db: DatabasePool) {
    self.db = db
  }

  func get<T: StoreConvertible>(_ key: StoreKey.Typed<T>) async throws -> T? where T.StorageType == Int {
    let query = Store.select(\.intValue).where { $0.id.eq(key.rawValue) }
    if let value = try await db.read({ conn in try query.fetchOne(conn) }) ?? nil {
      return T.fromValue(value)
    }
    return nil
  }

  func get<T: StoreConvertible>(_ key: StoreKey.Typed<T>) async throws -> T? where T.StorageType == String {
    let query = Store.select(\.stringValue).where { $0.id.eq(key.rawValue) }
    if let value = try await db.read({ conn in try query.fetchOne(conn) }) ?? nil {
      return T.fromValue(value)
    }
    return nil
  }

  func set<T: StoreConvertible>(_ key: StoreKey.Typed<T>, value: T) async throws where T.StorageType == Int {
    try await db.write { conn in
      try Store.upsert { Store(id: key.rawValue, stringValue: nil, intValue: T.toValue(value)) }.execute(conn)
    }
  }

  func set<T: StoreConvertible>(_ key: StoreKey.Typed<T>, value: String) async throws where T.StorageType == String {
    try await db.write { conn in
      try Store.upsert { Store(id: key.rawValue, stringValue: value, intValue: nil) }.execute(conn)
    }
  }
}
