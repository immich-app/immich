import 'dart:async';

import 'package:immich_mobile/domain/models/store.model.dart';

abstract class IStoreConverter<T, U> {
  const IStoreConverter();

  /// Converts the value T to the primitive type U supported by the Store
  U toPrimitive(T value);

  /// Converts the value back to T? from the primitive type U from the Store
  FutureOr<T?> fromPrimitive(U value);
}

abstract interface class IStoreRepository {
  FutureOr<bool> upsert<T, U>(StoreKey<T, U> key, T value);

  FutureOr<T> get<T, U>(StoreKey<T, U> key);

  FutureOr<T?> tryGet<T, U>(StoreKey<T, U> key);

  Stream<T?> watch<T, U>(StoreKey<T, U> key);

  FutureOr<void> delete(StoreKey key);

  FutureOr<void> deleteAll();
}
