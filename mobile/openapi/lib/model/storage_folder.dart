//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Storage folder
enum StorageFolder {
  encodedVideo._(r'encoded-video'),
  library_._(r'library'),
  upload._(r'upload'),
  profile._(r'profile'),
  thumbs._(r'thumbs'),
  backups._(r'backups'),
  ;

  /// Instantiate a new enum with the provided value.
  const StorageFolder._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [StorageFolder] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static StorageFolder? fromJson(dynamic value) => StorageFolderTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [StorageFolder]
  /// that were successfully decoded from the passed [JSON][json].
  static List<StorageFolder> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <StorageFolder>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = StorageFolder.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [StorageFolder] to String,
/// and [decode] dynamic data back to [StorageFolder].
class StorageFolderTypeTransformer {
  factory StorageFolderTypeTransformer() => _instance ??= const StorageFolderTypeTransformer._();

  const StorageFolderTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(StorageFolder data) => data._value;

  /// Returns the instance of [StorageFolder] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  StorageFolder? decode(dynamic data, {bool allowNull = true}) {
    if (data is StorageFolder) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'encoded-video': return StorageFolder.encodedVideo;
        case r'library': return StorageFolder.library_;
        case r'upload': return StorageFolder.upload;
        case r'profile': return StorageFolder.profile;
        case r'thumbs': return StorageFolder.thumbs;
        case r'backups': return StorageFolder.backups;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static StorageFolderTypeTransformer? _instance;
}

