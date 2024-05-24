import 'dart:async';

import 'package:immich_mobile/domain/models/store.model.dart';

abstract class IStoreConverter<T, U> {
  const IStoreConverter();

  /// Converts the value T to the primitive type U supported by the Store
  U toPrimitive(T value);

  /// Converts the value back to T? from the primitive type U from the Store
  T? fromPrimitive(U value);
}

abstract class IStoreRepository {
  FutureOr<T?> getValue<T, U>(StoreKey<T, U> key);

  FutureOr<bool> setValue<T, U>(StoreKey<T, U> key, T value);

  FutureOr<void> deleteValue(StoreKey key);

  Stream<T?> watchValue<T, U>(StoreKey<T, U> key);

  Stream<List<StoreValue>> watchStore();

  FutureOr<void> clearStore();
}
