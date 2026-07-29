//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// User metadata key
enum UserMetadataKey {
  preferences._(r'preferences'),
  license._(r'license'),
  onboarding._(r'onboarding'),
  ;

  /// Instantiate a new enum with the provided value.
  const UserMetadataKey._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [UserMetadataKey] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static UserMetadataKey? fromJson(dynamic value) => UserMetadataKeyTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [UserMetadataKey]
  /// that were successfully decoded from the passed [JSON][json].
  static List<UserMetadataKey> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserMetadataKey>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserMetadataKey.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserMetadataKey] to String,
/// and [decode] dynamic data back to [UserMetadataKey].
class UserMetadataKeyTypeTransformer {
  factory UserMetadataKeyTypeTransformer() => _instance ??= const UserMetadataKeyTypeTransformer._();

  const UserMetadataKeyTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(UserMetadataKey data) => data._value;

  /// Returns the instance of [UserMetadataKey] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserMetadataKey? decode(dynamic data, {bool allowNull = true}) {
    if (data is UserMetadataKey) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'preferences': return UserMetadataKey.preferences;
        case r'license': return UserMetadataKey.license;
        case r'onboarding': return UserMetadataKey.onboarding;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static UserMetadataKeyTypeTransformer? _instance;
}

