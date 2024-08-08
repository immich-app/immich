//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class EditorActionType {
  /// Instantiate a new enum with the provided [value].
  const EditorActionType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const crop = EditorActionType._(r'crop');
  static const rotate = EditorActionType._(r'rotate');
  static const blur = EditorActionType._(r'blur');
  static const adjust = EditorActionType._(r'adjust');

  /// List of all possible values in this [enum][EditorActionType].
  static const values = <EditorActionType>[
    crop,
    rotate,
    blur,
    adjust,
  ];

  static EditorActionType? fromJson(dynamic value) => EditorActionTypeTypeTransformer().decode(value);

  static List<EditorActionType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EditorActionType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EditorActionType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [EditorActionType] to String,
/// and [decode] dynamic data back to [EditorActionType].
class EditorActionTypeTypeTransformer {
  factory EditorActionTypeTypeTransformer() => _instance ??= const EditorActionTypeTypeTransformer._();

  const EditorActionTypeTypeTransformer._();

  String encode(EditorActionType data) => data.value;

  /// Decodes a [dynamic value][data] to a EditorActionType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  EditorActionType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'crop': return EditorActionType.crop;
        case r'rotate': return EditorActionType.rotate;
        case r'blur': return EditorActionType.blur;
        case r'adjust': return EditorActionType.adjust;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [EditorActionTypeTypeTransformer] instance.
  static EditorActionTypeTypeTransformer? _instance;
}

