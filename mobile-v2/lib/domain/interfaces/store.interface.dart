import 'dart:async';

import 'package:immich_mobile/domain/models/store.model.dart';

abstract class IStoreRepository {
  FutureOr<T?> getValue<T>(StoreKey key);

  FutureOr<void> setValue<T>(StoreKey key, T value);

  FutureOr<void> deleteValue(StoreKey key);

  Stream<T?> watchValue<T>(StoreKey key);

  Stream<List<StoreValue>> watchStore();

  FutureOr<void> clearStore();
}
