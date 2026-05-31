// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Storage folder
enum StorageFolder {
  encodedVideo._(r'encoded-video'),
  library$._(r'library'),
  upload._(r'upload'),
  profile._(r'profile'),
  thumbs._(r'thumbs'),
  backups._(r'backups'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const StorageFolder._(this.value);

  final String value;

  static StorageFolder? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
