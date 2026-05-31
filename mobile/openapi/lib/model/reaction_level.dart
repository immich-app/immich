// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Reaction level
enum ReactionLevel {
  album._(r'album'),
  asset._(r'asset'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const ReactionLevel._(this.value);

  final String value;

  static ReactionLevel? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
