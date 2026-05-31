// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Job name
enum AssetJobName {
  refreshFaces._(r'refresh-faces'),
  refreshMetadata._(r'refresh-metadata'),
  regenerateThumbnail._(r'regenerate-thumbnail'),
  transcodeVideo._(r'transcode-video'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AssetJobName._(this.value);

  final String value;

  static AssetJobName? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
