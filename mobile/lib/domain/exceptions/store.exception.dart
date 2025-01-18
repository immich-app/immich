import 'package:immich_mobile/domain/models/store.model.dart';

class StoreUnInitializedException implements Exception {
  const StoreUnInitializedException();

  @override
  String toString() => "Store not initialized. Call init()";
}

class StoreKeyNotFoundException implements Exception {
  final StoreKey key;
  const StoreKeyNotFoundException(this.key);

  @override
  String toString() => "Key - <${key.name}> not available in Store";
}

class StoreUnkownTypeException implements Exception {
  final StoreKey key;
  const StoreUnkownTypeException(this.key);

  @override
  String toString() =>
      "Unsupported type for Key - <${key.name}> type - <${key.type}}>";
}
