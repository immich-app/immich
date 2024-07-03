//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class PathType {
  /// Instantiate a new enum with the provided [value].
  const PathType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const original = PathType._(r'original');
  static const preview = PathType._(r'preview');
  static const thumbnail = PathType._(r'thumbnail');
  static const encodedVideo = PathType._(r'encoded_video');
  static const sidecar = PathType._(r'sidecar');
  static const face = PathType._(r'face');
  static const profile = PathType._(r'profile');

  /// List of all possible values in this [enum][PathType].
  static const values = <PathType>[
    original,
    preview,
    thumbnail,
    encodedVideo,
    sidecar,
    face,
    profile,
  ];

  static PathType? fromJson(dynamic value) => PathTypeTypeTransformer().decode(value);

  static List<PathType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PathType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PathType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PathType] to String,
/// and [decode] dynamic data back to [PathType].
class PathTypeTypeTransformer {
  factory PathTypeTypeTransformer() => _instance ??= const PathTypeTypeTransformer._();

  const PathTypeTypeTransformer._();

  String encode(PathType data) => data.value;

  /// Decodes a [dynamic value][data] to a PathType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PathType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'original': return PathType.original;
        case r'preview': return PathType.preview;
        case r'thumbnail': return PathType.thumbnail;
        case r'encoded_video': return PathType.encodedVideo;
        case r'sidecar': return PathType.sidecar;
        case r'face': return PathType.face;
        case r'profile': return PathType.profile;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PathTypeTypeTransformer] instance.
  static PathTypeTypeTransformer? _instance;
}

