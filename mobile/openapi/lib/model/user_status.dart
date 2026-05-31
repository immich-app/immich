// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// User status
enum UserStatus {
  active._(r'active'),
  removing._(r'removing'),
  deleted._(r'deleted'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const UserStatus._(this.value);

  final String value;

  static UserStatus? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
