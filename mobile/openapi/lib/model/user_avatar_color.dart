//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class UserAvatarColor {
  /// Instantiate a new enum with the provided [value].
  const UserAvatarColor._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const primary = UserAvatarColor._(r'primary');
  static const pink = UserAvatarColor._(r'pink');
  static const red = UserAvatarColor._(r'red');
  static const yellow = UserAvatarColor._(r'yellow');
  static const blue = UserAvatarColor._(r'blue');
  static const green = UserAvatarColor._(r'green');
  static const purple = UserAvatarColor._(r'purple');
  static const orange = UserAvatarColor._(r'orange');
  static const gray = UserAvatarColor._(r'gray');
  static const amber = UserAvatarColor._(r'amber');

  /// List of all possible values in this [enum][UserAvatarColor].
  static const values = <UserAvatarColor>[
    primary,
    pink,
    red,
    yellow,
    blue,
    green,
    purple,
    orange,
    gray,
    amber,
  ];

  static UserAvatarColor? fromJson(dynamic value) => UserAvatarColorTypeTransformer().decode(value);

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

  String encode(UserAvatarColor data) => data.value;

  /// Decodes a [dynamic value][data] to a UserAvatarColor.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserAvatarColor? decode(dynamic data, {bool allowNull = true}) {
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

  /// Singleton [UserAvatarColorTypeTransformer] instance.
  static UserAvatarColorTypeTransformer? _instance;
}

