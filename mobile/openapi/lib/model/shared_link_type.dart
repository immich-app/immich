// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Shared link type
enum SharedLinkType {
  album._(r'ALBUM'),
  individual._(r'INDIVIDUAL'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const SharedLinkType._(this.value);

  final String value;

  static SharedLinkType? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
