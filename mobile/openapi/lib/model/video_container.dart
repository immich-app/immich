//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class VideoContainer {
  /// Instantiate a new enum with the provided [value].
  const VideoContainer._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const mov = VideoContainer._(r'mov');
  static const mp4 = VideoContainer._(r'mp4');
  static const ogg = VideoContainer._(r'ogg');
  static const webm = VideoContainer._(r'webm');

  /// List of all possible values in this [enum][VideoContainer].
  static const values = <VideoContainer>[
    mov,
    mp4,
    ogg,
    webm,
  ];

  static VideoContainer? fromJson(dynamic value) => VideoContainerTypeTransformer().decode(value);

  static List<VideoContainer> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <VideoContainer>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = VideoContainer.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [VideoContainer] to String,
/// and [decode] dynamic data back to [VideoContainer].
class VideoContainerTypeTransformer {
  factory VideoContainerTypeTransformer() => _instance ??= const VideoContainerTypeTransformer._();

  const VideoContainerTypeTransformer._();

  String encode(VideoContainer data) => data.value;

  /// Decodes a [dynamic value][data] to a VideoContainer.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  VideoContainer? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'mov': return VideoContainer.mov;
        case r'mp4': return VideoContainer.mp4;
        case r'ogg': return VideoContainer.ogg;
        case r'webm': return VideoContainer.webm;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [VideoContainerTypeTransformer] instance.
  static VideoContainerTypeTransformer? _instance;
}

