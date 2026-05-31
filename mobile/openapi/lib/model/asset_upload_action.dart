// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Upload action
enum AssetUploadAction {
  accept._(r'accept'),
  reject._(r'reject'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AssetUploadAction._(this.value);

  final String value;

  static AssetUploadAction? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
