// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Album user role
enum AlbumUserRole {
  editor._(r'editor'),
  owner._(r'owner'),
  viewer._(r'viewer'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AlbumUserRole._(this.value);

  final String value;

  static AlbumUserRole? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
