//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Face exclusion rule for this classification category
class ClassificationFaceExclusion {
  /// Instantiate a new enum with the provided [value].
  const ClassificationFaceExclusion._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const off = ClassificationFaceExclusion._(r'off');
  static const anyAssignedFace = ClassificationFaceExclusion._(r'any_assigned_face');
  static const namedPeople = ClassificationFaceExclusion._(r'named_people');
  static const namedVisiblePeople = ClassificationFaceExclusion._(r'named_visible_people');

  /// List of all possible values in this [enum][ClassificationFaceExclusion].
  static const values = <ClassificationFaceExclusion>[
    off,
    anyAssignedFace,
    namedPeople,
    namedVisiblePeople,
  ];

  static ClassificationFaceExclusion? fromJson(dynamic value) => ClassificationFaceExclusionTypeTransformer().decode(value);

  static List<ClassificationFaceExclusion> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ClassificationFaceExclusion>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ClassificationFaceExclusion.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ClassificationFaceExclusion] to String,
/// and [decode] dynamic data back to [ClassificationFaceExclusion].
class ClassificationFaceExclusionTypeTransformer {
  factory ClassificationFaceExclusionTypeTransformer() => _instance ??= const ClassificationFaceExclusionTypeTransformer._();

  const ClassificationFaceExclusionTypeTransformer._();

  String encode(ClassificationFaceExclusion data) => data.value;

  /// Decodes a [dynamic value][data] to a ClassificationFaceExclusion.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ClassificationFaceExclusion? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'off': return ClassificationFaceExclusion.off;
        case r'any_assigned_face': return ClassificationFaceExclusion.anyAssignedFace;
        case r'named_people': return ClassificationFaceExclusion.namedPeople;
        case r'named_visible_people': return ClassificationFaceExclusion.namedVisiblePeople;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ClassificationFaceExclusionTypeTransformer] instance.
  static ClassificationFaceExclusionTypeTransformer? _instance;
}

