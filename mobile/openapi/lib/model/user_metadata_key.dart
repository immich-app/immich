//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class UserMetadataKey {
  /// Instantiate a new enum with the provided [value].
  const UserMetadataKey._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const preferences = UserMetadataKey._(r'preferences');
  static const license = UserMetadataKey._(r'license');
  static const onboarding = UserMetadataKey._(r'onboarding');

  /// List of all possible values in this [enum][UserMetadataKey].
  static const values = <UserMetadataKey>[
    preferences,
    license,
    onboarding,
  ];

  static UserMetadataKey? fromJson(dynamic value) => UserMetadataKeyTypeTransformer().decode(value);

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

  String encode(UserMetadataKey data) => data.value;

  /// Decodes a [dynamic value][data] to a UserMetadataKey.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserMetadataKey? decode(dynamic data, {bool allowNull = true}) {
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

  /// Singleton [UserMetadataKeyTypeTransformer] instance.
  static UserMetadataKeyTypeTransformer? _instance;
}

