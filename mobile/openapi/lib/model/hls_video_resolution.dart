//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// HLS video resolution
class HlsVideoResolution {
  /// Instantiate a new enum with the provided [value].
  const HlsVideoResolution._(this.value);

  /// The underlying value of this enum member.
  final num value;

  @override
  String toString() => value.toString();

  num toJson() => value;

  static const n480 = HlsVideoResolution._('480');
  static const n720 = HlsVideoResolution._('720');
  static const n1080 = HlsVideoResolution._('1080');
  static const n1440 = HlsVideoResolution._('1440');
  static const n2160 = HlsVideoResolution._('2160');

  /// List of all possible values in this [enum][HlsVideoResolution].
  static const values = <HlsVideoResolution>[
    n480,
    n720,
    n1080,
    n1440,
    n2160,
  ];

  static HlsVideoResolution? fromJson(dynamic value) => HlsVideoResolutionTypeTransformer().decode(value);

  static List<HlsVideoResolution> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <HlsVideoResolution>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = HlsVideoResolution.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [HlsVideoResolution] to num,
/// and [decode] dynamic data back to [HlsVideoResolution].
class HlsVideoResolutionTypeTransformer {
  factory HlsVideoResolutionTypeTransformer() => _instance ??= const HlsVideoResolutionTypeTransformer._();

  const HlsVideoResolutionTypeTransformer._();

  num encode(HlsVideoResolution data) => data.value;

  /// Decodes a [dynamic value][data] to a HlsVideoResolution.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  HlsVideoResolution? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case '480': return HlsVideoResolution.n480;
        case '720': return HlsVideoResolution.n720;
        case '1080': return HlsVideoResolution.n1080;
        case '1440': return HlsVideoResolution.n1440;
        case '2160': return HlsVideoResolution.n2160;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [HlsVideoResolutionTypeTransformer] instance.
  static HlsVideoResolutionTypeTransformer? _instance;
}

