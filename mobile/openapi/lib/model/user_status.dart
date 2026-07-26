//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// User status
enum UserStatus {
  active._(r'active'),
  removing._(r'removing'),
  deleted._(r'deleted'),
  ;

  /// Instantiate a new enum with the provided value.
  const UserStatus._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [UserStatus] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static UserStatus? fromJson(dynamic value) => UserStatusTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [UserStatus]
  /// that were successfully decoded from the passed [JSON][json].
  static List<UserStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserStatus] to String,
/// and [decode] dynamic data back to [UserStatus].
class UserStatusTypeTransformer {
  factory UserStatusTypeTransformer() => _instance ??= const UserStatusTypeTransformer._();

  const UserStatusTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(UserStatus data) => data._value;

  /// Returns the instance of [UserStatus] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data is UserStatus) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'active': return UserStatus.active;
        case r'removing': return UserStatus.removing;
        case r'deleted': return UserStatus.deleted;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static UserStatusTypeTransformer? _instance;
}

