//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class MapTheme {
  /// Instantiate a new enum with the provided [value].
  const MapTheme._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const light = MapTheme._(r'light');
  static const dark = MapTheme._(r'dark');

  /// List of all possible values in this [enum][MapTheme].
  static const values = <MapTheme>[
    light,
    dark,
  ];

  static MapTheme? fromJson(dynamic value) => MapThemeTypeTransformer().decode(value);

  static List<MapTheme> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MapTheme>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MapTheme.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [MapTheme] to String,
/// and [decode] dynamic data back to [MapTheme].
class MapThemeTypeTransformer {
  factory MapThemeTypeTransformer() => _instance ??= const MapThemeTypeTransformer._();

  const MapThemeTypeTransformer._();

  String encode(MapTheme data) => data.value;

  /// Decodes a [dynamic value][data] to a MapTheme.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MapTheme? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'light': return MapTheme.light;
        case r'dark': return MapTheme.dark;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [MapThemeTypeTransformer] instance.
  static MapThemeTypeTransformer? _instance;
}

