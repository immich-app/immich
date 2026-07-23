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
enum HlsVideoResolution {
  number480._(480),
  number720._(720),
  number1080._(1080),
  number1440._(1440),
  number2160._(2160),
  ;

  /// Instantiate a new enum with the provided value.
  const HlsVideoResolution._(this._value);

  /// The underlying value of this enum member.
  final int _value;

  @override
  String toString() => _value.toString();

  /// Encodes this enum as a value suitable for JSON.
  int toJson() => _value;

  /// Returns the instance of [HlsVideoResolution] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static HlsVideoResolution? fromJson(dynamic value) => HlsVideoResolutionTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [HlsVideoResolution]
  /// that were successfully decoded from the passed [JSON][json].
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

/// Transformation class that can [encode] an instance of [HlsVideoResolution] to int,
/// and [decode] dynamic data back to [HlsVideoResolution].
class HlsVideoResolutionTypeTransformer {
  factory HlsVideoResolutionTypeTransformer() => _instance ??= const HlsVideoResolutionTypeTransformer._();

  const HlsVideoResolutionTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  int encode(HlsVideoResolution data) => data._value;

  /// Returns the instance of [HlsVideoResolution] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  HlsVideoResolution? decode(dynamic data, {bool allowNull = true}) {
    if (data is HlsVideoResolution) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case 480: return HlsVideoResolution.number480;
        case 720: return HlsVideoResolution.number720;
        case 1080: return HlsVideoResolution.number1080;
        case 1440: return HlsVideoResolution.number1440;
        case 2160: return HlsVideoResolution.number2160;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static HlsVideoResolutionTypeTransformer? _instance;
}

