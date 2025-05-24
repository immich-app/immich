import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/secure_storage.interface.dart';

final secureStorageRepositoryProvider =
    Provider((ref) => SecureStorageRepository(const FlutterSecureStorage()));

class SecureStorageRepository implements ISecureStorageRepository {
  final FlutterSecureStorage _secureStorage;

  SecureStorageRepository(this._secureStorage);

  @override
  Future<String?> read(String key) {
    return _secureStorage.read(key: key);
  }

  @override
  Future<void> write(String key, String value) {
    return _secureStorage.write(key: key, value: value);
  }

  @override
  Future<void> delete(String key) {
    return _secureStorage.delete(key: key);
  }
}
