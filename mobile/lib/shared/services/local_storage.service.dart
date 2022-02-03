import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';

class LocalStorageService {
  late Box _box;

  LocalStorageService() {
    _box = Hive.box(userInfoBox);
  }

  T get<T>(String key) {
    return _box.get(key);
  }

  put<T>(String key, T value) {
    return _box.put(key, value);
  }
}
