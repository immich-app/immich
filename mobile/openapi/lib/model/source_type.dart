//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SourceType {
  /// Instantiate a new enum with the provided [value].
  const SourceType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const machineLearning = SourceType._(r'machine-learning');
  static const exif = SourceType._(r'exif');

  /// List of all possible values in this [enum][SourceType].
  static const values = <SourceType>[
    machineLearning,
    exif,
  ];

  static SourceType? fromJson(dynamic value) => SourceTypeTypeTransformer().decode(value);

  static List<SourceType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SourceType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SourceType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SourceType] to String,
/// and [decode] dynamic data back to [SourceType].
class SourceTypeTypeTransformer {
  factory SourceTypeTypeTransformer() => _instance ??= const SourceTypeTypeTransformer._();

  const SourceTypeTypeTransformer._();

  String encode(SourceType data) => data.value;

  /// Decodes a [dynamic value][data] to a SourceType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SourceType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'machine-learning': return SourceType.machineLearning;
        case r'exif': return SourceType.exif;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SourceTypeTypeTransformer] instance.
  static SourceTypeTypeTransformer? _instance;
}

