import 'package:immich_mobile/domain/interfaces/store.interface.dart';

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

class StorePrimitiveConverter<T> extends IStoreConverter<T, T> {
  const StorePrimitiveConverter();

  @override
  T fromPrimitive(T value) => value;

  @override
  T toPrimitive(T value) => value;
}
