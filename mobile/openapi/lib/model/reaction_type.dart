// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Reaction type
enum ReactionType {
  comment._(r'comment'),
  like._(r'like'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const ReactionType._(this.value);

  final String value;

  static ReactionType? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
