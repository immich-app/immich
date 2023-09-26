//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class CitiesFile {
  /// Instantiate a new enum with the provided [value].
  const CitiesFile._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const cities15000 = CitiesFile._(r'cities15000');
  static const cities5000 = CitiesFile._(r'cities5000');
  static const cities1000 = CitiesFile._(r'cities1000');
  static const cities500 = CitiesFile._(r'cities500');

  /// List of all possible values in this [enum][CitiesFile].
  static const values = <CitiesFile>[
    cities15000,
    cities5000,
    cities1000,
    cities500,
  ];

  static CitiesFile? fromJson(dynamic value) => CitiesFileTypeTransformer().decode(value);

  static List<CitiesFile>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CitiesFile>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CitiesFile.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [CitiesFile] to String,
/// and [decode] dynamic data back to [CitiesFile].
class CitiesFileTypeTransformer {
  factory CitiesFileTypeTransformer() => _instance ??= const CitiesFileTypeTransformer._();

  const CitiesFileTypeTransformer._();

  String encode(CitiesFile data) => data.value;

  /// Decodes a [dynamic value][data] to a CitiesFile.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  CitiesFile? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'cities15000': return CitiesFile.cities15000;
        case r'cities5000': return CitiesFile.cities5000;
        case r'cities1000': return CitiesFile.cities1000;
        case r'cities500': return CitiesFile.cities500;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [CitiesFileTypeTransformer] instance.
  static CitiesFileTypeTransformer? _instance;
}

