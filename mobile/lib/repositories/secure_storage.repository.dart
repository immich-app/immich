import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final secureStorageRepositoryProvider =
    Provider((ref) => SecureStorageRepository(const FlutterSecureStorage()));

class SecureStorageRepository {
  final FlutterSecureStorage _secureStorage;

  SecureStorageRepository(this._secureStorage);

  Future<String?> read(String key) {
    return _secureStorage.read(key: key);
  }

  Future<void> write(String key, String value) {
    return _secureStorage.write(key: key, value: value);
  }

  Future<void> delete(String key) {
    return _secureStorage.delete(key: key);
  }
}
