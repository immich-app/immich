// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Asset type
enum AssetTypeEnum {
  image._(r'IMAGE'),
  video._(r'VIDEO'),
  audio._(r'AUDIO'),
  other._(r'OTHER'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AssetTypeEnum._(this.value);

  final String value;

  static AssetTypeEnum? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
