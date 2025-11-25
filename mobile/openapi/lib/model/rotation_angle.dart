//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Rotation angle in degrees
class RotationAngle {
  /// Instantiate a new enum with the provided [value].
  const RotationAngle._(this.value);

  /// The underlying value of this enum member.
  final num value;

  @override
  String toString() => value.toString();

  num toJson() => value;

  static const n0 = RotationAngle._('0');
  static const n90 = RotationAngle._('90');
  static const n180 = RotationAngle._('180');
  static const n270 = RotationAngle._('270');

  /// List of all possible values in this [enum][RotationAngle].
  static const values = <RotationAngle>[
    n0,
    n90,
    n180,
    n270,
  ];

  static RotationAngle? fromJson(dynamic value) => RotationAngleTypeTransformer().decode(value);

  static List<RotationAngle> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RotationAngle>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RotationAngle.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [RotationAngle] to num,
/// and [decode] dynamic data back to [RotationAngle].
class RotationAngleTypeTransformer {
  factory RotationAngleTypeTransformer() => _instance ??= const RotationAngleTypeTransformer._();

  const RotationAngleTypeTransformer._();

  num encode(RotationAngle data) => data.value;

  /// Decodes a [dynamic value][data] to a RotationAngle.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  RotationAngle? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case '0': return RotationAngle.n0;
        case '90': return RotationAngle.n90;
        case '180': return RotationAngle.n180;
        case '270': return RotationAngle.n270;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [RotationAngleTypeTransformer] instance.
  static RotationAngleTypeTransformer? _instance;
}

