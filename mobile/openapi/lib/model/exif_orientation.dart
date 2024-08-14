//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ExifOrientation {
  /// Instantiate a new enum with the provided [value].
  const ExifOrientation._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const n1 = ExifOrientation._(r'1');
  static const n2 = ExifOrientation._(r'2');
  static const n3 = ExifOrientation._(r'3');
  static const n4 = ExifOrientation._(r'4');
  static const n5 = ExifOrientation._(r'5');
  static const n6 = ExifOrientation._(r'6');
  static const n7 = ExifOrientation._(r'7');
  static const n8 = ExifOrientation._(r'8');

  /// List of all possible values in this [enum][ExifOrientation].
  static const values = <ExifOrientation>[
    n1,
    n2,
    n3,
    n4,
    n5,
    n6,
    n7,
    n8,
  ];

  static ExifOrientation? fromJson(dynamic value) => ExifOrientationTypeTransformer().decode(value);

  static List<ExifOrientation> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ExifOrientation>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ExifOrientation.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ExifOrientation] to String,
/// and [decode] dynamic data back to [ExifOrientation].
class ExifOrientationTypeTransformer {
  factory ExifOrientationTypeTransformer() => _instance ??= const ExifOrientationTypeTransformer._();

  const ExifOrientationTypeTransformer._();

  String encode(ExifOrientation data) => data.value;

  /// Decodes a [dynamic value][data] to a ExifOrientation.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ExifOrientation? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'1': return ExifOrientation.n1;
        case r'2': return ExifOrientation.n2;
        case r'3': return ExifOrientation.n3;
        case r'4': return ExifOrientation.n4;
        case r'5': return ExifOrientation.n5;
        case r'6': return ExifOrientation.n6;
        case r'7': return ExifOrientation.n7;
        case r'8': return ExifOrientation.n8;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ExifOrientationTypeTransformer] instance.
  static ExifOrientationTypeTransformer? _instance;
}

