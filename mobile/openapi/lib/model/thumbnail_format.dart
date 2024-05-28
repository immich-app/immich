//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ThumbnailFormat {
  /// Instantiate a new enum with the provided [value].
  const ThumbnailFormat._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const JPEG = ThumbnailFormat._(r'JPEG');
  static const WEBP = ThumbnailFormat._(r'WEBP');

  /// List of all possible values in this [enum][ThumbnailFormat].
  static const values = <ThumbnailFormat>[
    JPEG,
    WEBP,
  ];

  static ThumbnailFormat? fromJson(dynamic value) => ThumbnailFormatTypeTransformer().decode(value);

  static List<ThumbnailFormat> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ThumbnailFormat>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ThumbnailFormat.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ThumbnailFormat] to String,
/// and [decode] dynamic data back to [ThumbnailFormat].
class ThumbnailFormatTypeTransformer {
  factory ThumbnailFormatTypeTransformer() => _instance ??= const ThumbnailFormatTypeTransformer._();

  const ThumbnailFormatTypeTransformer._();

  String encode(ThumbnailFormat data) => data.value;

  /// Decodes a [dynamic value][data] to a ThumbnailFormat.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ThumbnailFormat? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'JPEG': return ThumbnailFormat.JPEG;
        case r'WEBP': return ThumbnailFormat.WEBP;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ThumbnailFormatTypeTransformer] instance.
  static ThumbnailFormatTypeTransformer? _instance;
}

