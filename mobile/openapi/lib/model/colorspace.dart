//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Colorspace
enum Colorspace {
  srgb._(r'srgb'),
  p3._(r'p3'),
  ;

  /// Instantiate a new enum with the provided value.
  const Colorspace._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [Colorspace] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static Colorspace? fromJson(dynamic value) => ColorspaceTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [Colorspace]
  /// that were successfully decoded from the passed [JSON][json].
  static List<Colorspace> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <Colorspace>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = Colorspace.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [Colorspace] to String,
/// and [decode] dynamic data back to [Colorspace].
class ColorspaceTypeTransformer {
  factory ColorspaceTypeTransformer() => _instance ??= const ColorspaceTypeTransformer._();

  const ColorspaceTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(Colorspace data) => data._value;

  /// Returns the instance of [Colorspace] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  Colorspace? decode(dynamic data, {bool allowNull = true}) {
    if (data is Colorspace) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'srgb': return Colorspace.srgb;
        case r'p3': return Colorspace.p3;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static ColorspaceTypeTransformer? _instance;
}

