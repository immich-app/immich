//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetJobName {
  /// Instantiate a new enum with the provided [value].
  const AssetJobName._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const refreshFaces = AssetJobName._(r'refresh-faces');
  static const refreshMetadata = AssetJobName._(r'refresh-metadata');
  static const regenerateThumbnail = AssetJobName._(r'regenerate-thumbnail');
  static const transcodeVideo = AssetJobName._(r'transcode-video');

  /// List of all possible values in this [enum][AssetJobName].
  static const values = <AssetJobName>[
    refreshFaces,
    refreshMetadata,
    regenerateThumbnail,
    transcodeVideo,
  ];

  static AssetJobName? fromJson(dynamic value) => AssetJobNameTypeTransformer().decode(value);

  static List<AssetJobName> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetJobName>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetJobName.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetJobName] to String,
/// and [decode] dynamic data back to [AssetJobName].
class AssetJobNameTypeTransformer {
  factory AssetJobNameTypeTransformer() => _instance ??= const AssetJobNameTypeTransformer._();

  const AssetJobNameTypeTransformer._();

  String encode(AssetJobName data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetJobName.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetJobName? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'refresh-faces': return AssetJobName.refreshFaces;
        case r'refresh-metadata': return AssetJobName.refreshMetadata;
        case r'regenerate-thumbnail': return AssetJobName.regenerateThumbnail;
        case r'transcode-video': return AssetJobName.transcodeVideo;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetJobNameTypeTransformer] instance.
  static AssetJobNameTypeTransformer? _instance;
}

