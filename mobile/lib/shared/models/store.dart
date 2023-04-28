import 'package:collection/collection.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:isar/isar.dart';

part 'store.g.dart';

/// Key-value store for individual items enumerated in StoreKey.
/// Supports String, int and JSON-serializable Objects
/// Can be used concurrently from multiple isolates
class Store {
  static late final Isar _db;
  static final List<dynamic> _cache =
      List.filled(StoreKey.values.map((e) => e.id).max + 1, null);

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

  /// Returns the stored value for the given key or if null the [defaultValue]
  /// Throws a [StoreKeyNotFoundException] if both are null
  static T get<T>(StoreKey<T> key, [T? defaultValue]) {
    final value = _cache[key.id] ?? defaultValue;
    if (value == null) {
      throw StoreKeyNotFoundException(key);
    }
    return value;
  }

  /// Watches a specific key for changes
  static Stream<T?> watch<T>(StoreKey<T> key) =>
      _db.storeValues.watchObject(key.id).map((e) => e?._extract(key));

  /// Returns the stored value for the given key (possibly null)
  static T? tryGet<T>(StoreKey<T> key) => _cache[key.id];

  /// Stores the value synchronously in the cache and asynchronously in the DB
  static Future<void> put<T>(StoreKey<T> key, T value) {
    _cache[key.id] = value;
    return _db.writeTxn(
      () async => _db.storeValues.put(await StoreValue._of(value, key)),
    );
  }

  /// Removes the value synchronously from the cache and asynchronously from the DB
  static Future<void> delete<T>(StoreKey<T> key) {
    _cache[key.id] = null;
    return _db.writeTxn(() => _db.storeValues.delete(key.id));
  }

  /// Fills the cache with the values from the DB
  static _populateCache() {
    for (StoreKey key in StoreKey.values) {
      final StoreValue? value = _db.storeValues.getSync(key.id);
      if (value != null) {
        _cache[key.id] = value._extract(key);
      }
    }
  }

  /// updates the state if a value is updated in any isolate
  static void _onChangeListener(List<StoreValue>? data) {
    if (data != null) {
      for (StoreValue value in data) {
        _cache[value.id] =
            value._extract(StoreKey.values.firstWhere((e) => e.id == value.id));
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

  T? _extract<T>(StoreKey<T> key) {
    switch (key.type) {
      case int:
        return intValue as T?;
      case bool:
        return intValue == null ? null : (intValue! == 1) as T;
      case DateTime:
        return intValue == null
            ? null
            : DateTime.fromMicrosecondsSinceEpoch(intValue!) as T;
      case String:
        return strValue as T?;
      default:
        if (key.fromDb != null) {
          return key.fromDb!.call(Store._db, intValue!);
        }
    }
    throw TypeError();
  }

  static Future<StoreValue> _of<T>(T? value, StoreKey<T> key) async {
    int? i;
    String? s;
    switch (key.type) {
      case int:
        i = value as int?;
        break;
      case bool:
        i = value == null ? null : (value == true ? 1 : 0);
        break;
      case DateTime:
        i = value == null ? null : (value as DateTime).microsecondsSinceEpoch;
        break;
      case String:
        s = value as String?;
        break;
      default:
        if (key.toDb != null) {
          i = await key.toDb!.call(Store._db, value);
          break;
        }
        throw TypeError();
    }
    return StoreValue(key.id, intValue: i, strValue: s);
  }
}

class StoreKeyNotFoundException implements Exception {
  final StoreKey key;
  StoreKeyNotFoundException(this.key);
  @override
  String toString() => "Key '${key.name}' not found in Store";
}

/// Key for each possible value in the `Store`.
/// Defines the data type for each value
enum StoreKey<T> {
  version<int>(0, type: int),
  assetETag<String>(1, type: String),
  currentUser<User>(2, type: User, fromDb: _getUser, toDb: _toUser),
  deviceIdHash<int>(3, type: int),
  deviceId<String>(4, type: String),
  backupFailedSince<DateTime>(5, type: DateTime),
  backupRequireWifi<bool>(6, type: bool),
  backupRequireCharging<bool>(7, type: bool),
  backupTriggerDelay<int>(8, type: int),
  githubReleaseInfo<String>(9, type: String),
  serverUrl<String>(10, type: String),
  accessToken<String>(11, type: String),
  serverEndpoint<String>(12, type: String),
  autoBackup<bool>(13, type: bool),
  // user settings from [AppSettingsEnum] below:
  loadPreview<bool>(100, type: bool),
  loadOriginal<bool>(101, type: bool),
  themeMode<String>(102, type: String),
  tilesPerRow<int>(103, type: int),
  dynamicLayout<bool>(104, type: bool),
  groupAssetsBy<int>(105, type: int),
  uploadErrorNotificationGracePeriod<int>(106, type: int),
  backgroundBackupTotalProgress<bool>(107, type: bool),
  backgroundBackupSingleProgress<bool>(108, type: bool),
  storageIndicator<bool>(109, type: bool),
  thumbnailCacheSize<int>(110, type: int),
  imageCacheSize<int>(111, type: int),
  albumThumbnailCacheSize<int>(112, type: int),
  selectedAlbumSortOrder<int>(113, type: int),
  advancedTroubleshooting<bool>(114, type: bool),
  logLevel<int>(115, type: int),
  ;

  const StoreKey(
    this.id, {
    required this.type,
    this.fromDb,
    this.toDb,
  });
  final int id;
  final Type type;
  final T? Function<T>(Isar, int)? fromDb;
  final Future<int> Function<T>(Isar, T)? toDb;
}

T? _getUser<T>(Isar db, int i) {
  final User? u = db.users.getSync(i);
  return u as T?;
}

Future<int> _toUser<T>(Isar db, T u) {
  if (u is User) {
    return db.users.put(u);
  }
  throw TypeError();
}
