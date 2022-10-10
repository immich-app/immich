import 'dart:io';
import 'dart:math';

import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:flutter_cache_manager/src/storage/cache_object.dart';
import 'package:hive/hive.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

// Implementation of a CacheInfoRepository based on Hive
abstract class ImmichCacheRepository extends CacheInfoRepository {
  int getNumberOfCachedObjects();
  int getCacheSize();
}

class ImmichCacheInfoRepository extends ImmichCacheRepository {
  final String hiveBoxName;
  final String keyLookupHiveBoxName;

  // To circumvent some of the limitations of a non-relational key-value database,
  // we use two hive boxes per cache.
  // [cacheObjectLookupBox] maps ids to cache objects.
  // [keyLookupHiveBox] maps keys to ids.
  // The lookup of a cache object by key therefore involves two steps:
  // id = keyLookupHiveBox[key]
  // object = cacheObjectLookupBox[id]
  late Box<Map<dynamic, dynamic>> cacheObjectLookupBox;
  late Box<int> keyLookupHiveBox;

  ImmichCacheInfoRepository(this.hiveBoxName, this.keyLookupHiveBoxName);

  @override
  Future<bool> close() async {
    await cacheObjectLookupBox.close();
    return true;
  }

  @override
  Future<int> delete(int id) async {
    if (cacheObjectLookupBox.containsKey(id)) {
      await cacheObjectLookupBox.delete(id);
      return 1;
    }
    return 0;
  }

  @override
  Future<int> deleteAll(Iterable<int> ids) async {
    int deleted = 0;
    for (var id in ids) {
      if (cacheObjectLookupBox.containsKey(id)) {
        deleted++;
        await cacheObjectLookupBox.delete(id);
      }
    }
    return deleted;
  }

  @override
  Future<void> deleteDataFile() async {
    await cacheObjectLookupBox.clear();
    await keyLookupHiveBox.clear();
  }

  @override
  Future<bool> exists() async {
    return cacheObjectLookupBox.isNotEmpty && keyLookupHiveBox.isNotEmpty;
  }

  @override
  Future<CacheObject?> get(String key) async {
    if (!keyLookupHiveBox.containsKey(key)) {
      return null;
    }
    int id = keyLookupHiveBox.get(key)!;
    if (!cacheObjectLookupBox.containsKey(id)) {
      keyLookupHiveBox.delete(key);
      return null;
    }
    return _deserialize(cacheObjectLookupBox.get(id)!);
  }

  @override
  Future<List<CacheObject>> getAllObjects() async {
    return cacheObjectLookupBox.values.map(_deserialize).toList();
  }

  @override
  Future<List<CacheObject>> getObjectsOverCapacity(int capacity) async {
    if (cacheObjectLookupBox.length <= capacity) {
      return List.empty();
    }
    var values = cacheObjectLookupBox.values.map(_deserialize).toList();
    values.sort((CacheObject a, CacheObject b) {
      final aTouched = a.touched ?? DateTime.fromMicrosecondsSinceEpoch(0);
      final bTouched = b.touched ?? DateTime.fromMicrosecondsSinceEpoch(0);

      return aTouched.compareTo(bTouched);
    });
    return values.skip(capacity).take(10).toList();
  }

  @override
  Future<List<CacheObject>> getOldObjects(Duration maxAge) async {
    return cacheObjectLookupBox.values
        .map(_deserialize)
        .where((CacheObject element) {
      DateTime touched =
          element.touched ?? DateTime.fromMicrosecondsSinceEpoch(0);
      return touched.isBefore(DateTime.now().subtract(maxAge));
    }).toList();
  }

  @override
  Future<CacheObject> insert(
    CacheObject cacheObject, {
    bool setTouchedToNow = true,
  }) async {
    int newId = keyLookupHiveBox.length == 0
        ? 0
        : keyLookupHiveBox.values.reduce(max) + 1;
    cacheObject = cacheObject.copyWith(id: newId);

    keyLookupHiveBox.put(cacheObject.key, newId);
    cacheObjectLookupBox.put(newId, cacheObject.toMap());

    return cacheObject;
  }

  @override
  Future<bool> open() async {
    cacheObjectLookupBox = await Hive.openBox(hiveBoxName);
    keyLookupHiveBox = await Hive.openBox(keyLookupHiveBoxName);

    // The cache might have cleared by the operating system.
    // This could create inconsistencies between the file system cache and database.
    // To check whether the cache was cleared, a file within the cache directory
    // is created for each database. If the file is absent, the cache was cleared and therefore
    // the database has to be cleared as well.
    if (!await _checkAndCreateAnchorFile()) {
      await cacheObjectLookupBox.clear();
      await keyLookupHiveBox.clear();
    }

    return cacheObjectLookupBox.isOpen;
  }

  @override
  Future<int> update(
    CacheObject cacheObject, {
    bool setTouchedToNow = true,
  }) async {
    if (cacheObject.id != null) {
      cacheObjectLookupBox.put(cacheObject.id, cacheObject.toMap());
      return 1;
    }
    return 0;
  }

  @override
  Future updateOrInsert(CacheObject cacheObject) {
    if (cacheObject.id == null) {
      return insert(cacheObject);
    } else {
      return update(cacheObject);
    }
  }

  @override
  int getNumberOfCachedObjects() {
    return cacheObjectLookupBox.length;
  }

  @override
  int getCacheSize() {
    final cacheElementsWithSize =
        cacheObjectLookupBox.values.map(_deserialize).map((e) => e.length ?? 0);

    if (cacheElementsWithSize.isEmpty) {
      return 0;
    }

    return cacheElementsWithSize.reduce((value, element) => value + element);
  }

  CacheObject _deserialize(Map serData) {
    Map<String, dynamic> converted = {};

    serData.forEach((key, value) {
      converted[key.toString()] = value;
    });

    return CacheObject.fromMap(converted);
  }

  Future<bool> _checkAndCreateAnchorFile() async {
    final tmpDir = await getTemporaryDirectory();
    final cacheFile = File(p.join(tmpDir.path, "$hiveBoxName.tmp"));

    if (await cacheFile.exists()) {
      return true;
    }

    await cacheFile.create();

    return false;
  }
}
