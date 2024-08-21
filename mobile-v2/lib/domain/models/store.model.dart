import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
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

class StoreKeyNotFoundException implements Exception {
  final StoreKey key;
  const StoreKeyNotFoundException(this.key);

  @override
  String toString() => "Key '${key.name}' not found in Store";
}

/// Key for each possible value in the `Store`.
/// Also stores the converter to convert the value to and from the store and the type of value stored in the Store
enum StoreKey<T, U> {
  serverEndpoint<String, String>(
    0,
    converter: StoreStringConverter(),
    type: String,
  ),
  accessToken<String, String>(
    1,
    converter: StoreStringConverter(),
    type: String,
  ),
  currentUser<User, String>(
    2,
    converter: StoreUserConverter(),
    type: String,
  ),
  // App settings
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

  /// Primitive Type is also stored here to easily fetch it during runtime
  final Type type;
  final IStoreConverter<T, U> converter;
}
