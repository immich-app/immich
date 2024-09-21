import 'dart:async';

import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/service_locator.dart';

class StoreEnumConverter<T extends Enum> extends IStoreConverter<T, int> {
  const StoreEnumConverter(this.values);

  final List<T> values;

  @override
  T? fromPrimitive(int value) => values.elementAtOrNull(value);

  @override
  int toPrimitive(T value) => value.index;
}

class StoreBooleanConverter extends IStoreConverter<bool, int> {
  const StoreBooleanConverter();

  @override
  bool fromPrimitive(int value) => value != 0;

  @override
  int toPrimitive(bool value) => value ? 1 : 0;
}

class _StorePrimitiveConverter<T> extends IStoreConverter<T, T> {
  const _StorePrimitiveConverter();

  @override
  T fromPrimitive(T value) => value;

  @override
  T toPrimitive(T value) => value;
}

class StoreStringConverter extends _StorePrimitiveConverter<String> {
  const StoreStringConverter();
}

class StoreIntConverter extends _StorePrimitiveConverter<int> {
  const StoreIntConverter();
}

class StoreUserConverter extends IStoreConverter<User, String> {
  const StoreUserConverter();

  @override
  Future<User?> fromPrimitive(String value) async {
    return await di<IUserRepository>().getForId(value);
  }

  @override
  String toPrimitive(User value) => value.id;
}
