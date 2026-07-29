//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// User avatar color
enum UserAvatarColor {
  primary._(r'primary'),
  pink._(r'pink'),
  red._(r'red'),
  yellow._(r'yellow'),
  blue._(r'blue'),
  green._(r'green'),
  purple._(r'purple'),
  orange._(r'orange'),
  gray._(r'gray'),
  amber._(r'amber'),
  ;

  /// Instantiate a new enum with the provided value.
  const UserAvatarColor._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [UserAvatarColor] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static UserAvatarColor? fromJson(dynamic value) => UserAvatarColorTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [UserAvatarColor]
  /// that were successfully decoded from the passed [JSON][json].
  static List<UserAvatarColor> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserAvatarColor>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserAvatarColor.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserAvatarColor] to String,
/// and [decode] dynamic data back to [UserAvatarColor].
class UserAvatarColorTypeTransformer {
  factory UserAvatarColorTypeTransformer() => _instance ??= const UserAvatarColorTypeTransformer._();

  const UserAvatarColorTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(UserAvatarColor data) => data._value;

  /// Returns the instance of [UserAvatarColor] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserAvatarColor? decode(dynamic data, {bool allowNull = true}) {
    if (data is UserAvatarColor) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'primary': return UserAvatarColor.primary;
        case r'pink': return UserAvatarColor.pink;
        case r'red': return UserAvatarColor.red;
        case r'yellow': return UserAvatarColor.yellow;
        case r'blue': return UserAvatarColor.blue;
        case r'green': return UserAvatarColor.green;
        case r'purple': return UserAvatarColor.purple;
        case r'orange': return UserAvatarColor.orange;
        case r'gray': return UserAvatarColor.gray;
        case r'amber': return UserAvatarColor.amber;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static UserAvatarColorTypeTransformer? _instance;
}

