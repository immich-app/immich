import 'dart:collection';
import 'dart:math';

import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:flutter_cache_manager/src/storage/cache_object.dart';
import 'package:hive/hive.dart';

class ImmichCacheInfoRepository extends CacheInfoRepository {
  final String hiveBoxName;
  final String keyLookupHiveBoxName;

  late Box<Map<dynamic, dynamic>> hiveBox;
  late Box<int> keyLookupHiveBox;

  ImmichCacheInfoRepository(this.hiveBoxName, this.keyLookupHiveBoxName);

  @override
  Future<bool> close() async {
    await hiveBox.close();
    return true;
  }

  @override
  Future<int> delete(int id) async {
    if (hiveBox.containsKey(id)) {
      await hiveBox.delete(id);
      return 1;
    }
    return 0;
  }

  @override
  Future<int> deleteAll(Iterable<int> ids) async {
    int deleted = 0;
    for (var id in ids) {
      if (hiveBox.containsKey(id)) {
        deleted++;
        await hiveBox.delete(id);
      }
    }
    return deleted;
  }

  @override
  Future<void> deleteDataFile() async {
    await hiveBox.clear();
    await keyLookupHiveBox.clear();
  }

  @override
  Future<bool> exists() async {
    return hiveBox.isNotEmpty && keyLookupHiveBox.isNotEmpty;
  }

  @override
  Future<CacheObject?> get(String key) async {
    if (!keyLookupHiveBox.containsKey(key)) {
      return null;
    }
    int id = keyLookupHiveBox.get(key)!;
    if (!hiveBox.containsKey(id)) {
      keyLookupHiveBox.delete(key);
      return null;
    }
    return _deserialize(hiveBox.get(id)!);
  }

  @override
  Future<List<CacheObject>> getAllObjects() async {
    return hiveBox.values.map(_deserialize).toList();
  }

  @override
  Future<List<CacheObject>> getObjectsOverCapacity(int capacity) async {
    if (hiveBox.length <= capacity) {
      return List.empty();
    }
    var values = hiveBox.values.map(_deserialize).toList();
    values.sort((CacheObject a, CacheObject b) {
      final aTouched = a.touched ?? DateTime.fromMicrosecondsSinceEpoch(0);
      final bTouched = b.touched ?? DateTime.fromMicrosecondsSinceEpoch(0);

      return aTouched.compareTo(bTouched);
    });
    return values.skip(capacity).toList();
  }

  @override
  Future<List<CacheObject>> getOldObjects(Duration maxAge) async {
    return hiveBox.values.map(_deserialize).where((CacheObject element) {
      DateTime touched =
          element.touched ?? DateTime.fromMicrosecondsSinceEpoch(0);
      return touched.isBefore(DateTime.now().subtract(maxAge));
    }).toList();
  }

  @override
  Future<CacheObject> insert(CacheObject cacheObject,
      {bool setTouchedToNow = true}) async {
    int newId = keyLookupHiveBox.length == 0
        ? 0
        : keyLookupHiveBox.values.reduce(max) + 1;
    cacheObject = cacheObject.copyWith(id: newId);

    keyLookupHiveBox.put(cacheObject.key, newId);
    hiveBox.put(newId, cacheObject.toMap());

    return cacheObject;
  }

  @override
  Future<bool> open() async {
    hiveBox = await Hive.openBox(hiveBoxName);
    keyLookupHiveBox = await Hive.openBox(keyLookupHiveBoxName);

    return hiveBox.isOpen;
  }

  @override
  Future<int> update(CacheObject cacheObject,
      {bool setTouchedToNow = true}) async {
    if (cacheObject.id != null) {
      hiveBox.put(cacheObject.id, cacheObject.toMap());
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

  CacheObject _deserialize(Map serData) {
    Map<String, dynamic> converted = {};

    serData.forEach((key, value) {
      converted[key.toString()] = value;
    });

    return CacheObject.fromMap(converted);
  }
}
