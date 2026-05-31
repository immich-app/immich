// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Type of edit action to perform
enum AssetEditAction {
  crop._(r'crop'),
  rotate._(r'rotate'),
  mirror._(r'mirror'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AssetEditAction._(this.value);

  final String value;

  static AssetEditAction? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
