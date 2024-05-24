import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/utils/store_converters.dart';
import 'package:immich_mobile/presentation/modules/theme/models/app_theme.model.dart';

@immutable
class StoreValue<T> {
  final int id;
  final T? value;

  const StoreValue({required this.id, this.value});

  @override
  bool operator ==(covariant StoreValue other) {
    if (identical(this, other)) return true;

    return other.hashCode == hashCode;
  }

  @override
  int get hashCode => id.hashCode ^ value.hashCode;
}

/// Key for each possible value in the `Store`.
/// Also stores the converter to convert the value to and from the store and the type of value stored in the Store
enum StoreKey<T, U> {
  serverEndpoint<String, String>(
    0,
    converter: StorePrimitiveConverter(),
    type: String,
  ),
  appTheme<AppTheme, int>(
    1000,
    converter: StoreEnumConverter(AppTheme.values),
    type: int,
  ),
  themeMode<ThemeMode, int>(
    1001,
    converter: StoreEnumConverter(ThemeMode.values),
    type: int,
  ),
  darkMode<bool, int>(1002, converter: StoreBooleanConverter(), type: int);

  const StoreKey(this.id, {required this.converter, required this.type});
  final int id;

  /// Type is also stored here easily fetch it during runtime
  final Type type;
  final IStoreConverter<T, U> converter;
}
