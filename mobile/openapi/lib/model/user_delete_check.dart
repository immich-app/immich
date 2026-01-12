//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class UserDeleteCheck {
  /// Instantiate a new enum with the provided [value].
  const UserDeleteCheck._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const userDeleteCheck = UserDeleteCheck._(r'UserDeleteCheck');

  /// List of all possible values in this [enum][UserDeleteCheck].
  static const values = <UserDeleteCheck>[
    userDeleteCheck,
  ];

  static UserDeleteCheck? fromJson(dynamic value) => UserDeleteCheckTypeTransformer().decode(value);

  static List<UserDeleteCheck> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserDeleteCheck>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserDeleteCheck.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserDeleteCheck] to String,
/// and [decode] dynamic data back to [UserDeleteCheck].
class UserDeleteCheckTypeTransformer {
  factory UserDeleteCheckTypeTransformer() => _instance ??= const UserDeleteCheckTypeTransformer._();

  const UserDeleteCheckTypeTransformer._();

  String encode(UserDeleteCheck data) => data.value;

  /// Decodes a [dynamic value][data] to a UserDeleteCheck.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserDeleteCheck? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'UserDeleteCheck': return UserDeleteCheck.userDeleteCheck;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UserDeleteCheckTypeTransformer] instance.
  static UserDeleteCheckTypeTransformer? _instance;
}

