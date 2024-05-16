//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ModelType {
  /// Instantiate a new enum with the provided [value].
  const ModelType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const facialRecognition = ModelType._(r'facial-recognition');
  static const clip = ModelType._(r'clip');

  /// List of all possible values in this [enum][ModelType].
  static const values = <ModelType>[
    facialRecognition,
    clip,
  ];

  static ModelType? fromJson(dynamic value) => ModelTypeTypeTransformer().decode(value);

  static List<ModelType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ModelType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ModelType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ModelType] to String,
/// and [decode] dynamic data back to [ModelType].
class ModelTypeTypeTransformer {
  factory ModelTypeTypeTransformer() => _instance ??= const ModelTypeTypeTransformer._();

  const ModelTypeTypeTransformer._();

  String encode(ModelType data) => data.value;

  /// Decodes a [dynamic value][data] to a ModelType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ModelType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'facial-recognition': return ModelType.facialRecognition;
        case r'clip': return ModelType.clip;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ModelTypeTypeTransformer] instance.
  static ModelTypeTypeTransformer? _instance;
}

