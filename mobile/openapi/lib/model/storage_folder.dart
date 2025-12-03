//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class StorageFolder {
  /// Instantiate a new enum with the provided [value].
  const StorageFolder._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const encodedVideo = StorageFolder._(r'encoded-video');
  static const library_ = StorageFolder._(r'library');
  static const upload = StorageFolder._(r'upload');
  static const profile = StorageFolder._(r'profile');
  static const thumbs = StorageFolder._(r'thumbs');
  static const backups = StorageFolder._(r'backups');

  /// List of all possible values in this [enum][StorageFolder].
  static const values = <StorageFolder>[
    encodedVideo,
    library_,
    upload,
    profile,
    thumbs,
    backups,
  ];

  static StorageFolder? fromJson(dynamic value) => StorageFolderTypeTransformer().decode(value);

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

  String encode(StorageFolder data) => data.value;

  /// Decodes a [dynamic value][data] to a StorageFolder.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  StorageFolder? decode(dynamic data, {bool allowNull = true}) {
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

  /// Singleton [StorageFolderTypeTransformer] instance.
  static StorageFolderTypeTransformer? _instance;
}

