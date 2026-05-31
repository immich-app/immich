// AUTO-GENERATED FILE, DO NOT MODIFY!
//
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

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const UserAvatarColor._(this.value);

  final String value;

  static UserAvatarColor? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
