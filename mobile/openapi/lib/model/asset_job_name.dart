//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Job name
enum AssetJobName {
  refreshFaces._(r'refresh-faces'),
  refreshMetadata._(r'refresh-metadata'),
  regenerateThumbnail._(r'regenerate-thumbnail'),
  transcodeVideo._(r'transcode-video'),
  ;

  /// Instantiate a new enum with the provided value.
  const AssetJobName._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [AssetJobName] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static AssetJobName? fromJson(dynamic value) => AssetJobNameTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [AssetJobName]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(AssetJobName data) => data._value;

  /// Returns the instance of [AssetJobName] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetJobName? decode(dynamic data, {bool allowNull = true}) {
    if (data is AssetJobName) {
      return data;
    }
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

  /// The singleton instance of this transformer.
  static AssetJobNameTypeTransformer? _instance;
}

