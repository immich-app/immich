import 'package:isar/isar.dart';
import 'dart:convert';

part 'store.g.dart';

/// Key-value store for individual items enumerated in StoreKey.
/// Supports String, int and JSON-serializable Objects
/// Can be used concurrently from multiple isolates
class Store {
  static late final Isar _db;
  static final List<dynamic> _cache = List.filled(StoreKey.values.length, null);

  /// Initializes the store (call exactly once per app start)
  static void init(Isar db) {
    _db = db;
    _populateCache();
    _db.storeValues.where().build().watch().listen(_onChangeListener);
  }

  /// clears all values from this store (cache and DB), only for testing!
  static Future<void> clear() {
    _cache.fillRange(0, _cache.length, null);
    return _db.writeTxn(() => _db.storeValues.clear());
  }

  /// Returns the stored value for the given key, or the default value if null
  static T? get<T>(StoreKey key, [T? defaultValue]) =>
      _cache[key._id] ?? defaultValue;

  /// Stores the value synchronously in the cache and asynchronously in the DB
  static Future<void> put<T>(StoreKey key, T value) {
    _cache[key._id] = value;
    return _db.writeTxn(() => _db.storeValues.put(StoreValue._of(value, key)));
  }

  /// Removes the value synchronously from the cache and asynchronously from the DB
  static Future<void> delete(StoreKey key) {
    _cache[key._id] = null;
    return _db.writeTxn(() => _db.storeValues.delete(key._id));
  }

  /// Fills the cache with the values from the DB
  static _populateCache() {
    for (StoreKey key in StoreKey.values) {
      final StoreValue? value = _db.storeValues.getSync(key._id);
      if (value != null) {
        _cache[key._id] = value._extract(key);
      }
    }
  }

  /// updates the state if a value is updated in any isolate
  static void _onChangeListener(List<StoreValue>? data) {
    if (data != null) {
      for (StoreValue value in data) {
        _cache[value.id] = value._extract(StoreKey.values[value.id]);
      }
    }
  }
}

/// Internal class for `Store`, do not use elsewhere.
@Collection(inheritance: false)
class StoreValue {
  StoreValue(this.id, {this.intValue, this.strValue});
  Id id;
  int? intValue;
  String? strValue;

  T? _extract<T>(StoreKey key) => key._isInt
      ? intValue
      : (key._fromJson != null
          ? key._fromJson!(json.decode(strValue!))
          : strValue);
  static StoreValue _of(dynamic value, StoreKey key) => StoreValue(
        key._id,
        intValue: key._isInt ? value : null,
        strValue: key._isInt
            ? null
            : (key._fromJson == null ? value : json.encode(value.toJson())),
      );
}

/// Key for each possible value in the `Store`.
/// Defines the data type (int, String, JSON) for each value
enum StoreKey {
  userRemoteId(0),
  assetETag(1),
  ;

  // ignore: unused_element
  const StoreKey(this._id, [this._isInt = false, this._fromJson]);
  final int _id;
  final bool _isInt;
  final Function(dynamic)? _fromJson;
}
