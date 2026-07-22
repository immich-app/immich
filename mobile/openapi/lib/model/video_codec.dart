//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Target video codec
enum VideoCodec {
  h264._(r'h264'),
  hevc._(r'hevc'),
  vp9._(r'vp9'),
  av1._(r'av1'),
  ;

  /// Instantiate a new enum with the provided value.
  const VideoCodec._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [VideoCodec] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static VideoCodec? fromJson(dynamic value) => VideoCodecTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [VideoCodec]
  /// that were successfully decoded from the passed [JSON][json].
  static List<VideoCodec> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <VideoCodec>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = VideoCodec.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [VideoCodec] to String,
/// and [decode] dynamic data back to [VideoCodec].
class VideoCodecTypeTransformer {
  factory VideoCodecTypeTransformer() => _instance ??= const VideoCodecTypeTransformer._();

  const VideoCodecTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(VideoCodec data) => data._value;

  /// Returns the instance of [VideoCodec] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  VideoCodec? decode(dynamic data, {bool allowNull = true}) {
    if (data is VideoCodec) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'h264': return VideoCodec.h264;
        case r'hevc': return VideoCodec.hevc;
        case r'vp9': return VideoCodec.vp9;
        case r'av1': return VideoCodec.av1;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static VideoCodecTypeTransformer? _instance;
}

