//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class TagTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const TagTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const OBJECT = TagTypeEnum._(r'OBJECT');
  static const FACE = TagTypeEnum._(r'FACE');
  static const CUSTOM = TagTypeEnum._(r'CUSTOM');

  /// List of all possible values in this [enum][TagTypeEnum].
  static const values = <TagTypeEnum>[
    OBJECT,
    FACE,
    CUSTOM,
  ];

  static TagTypeEnum? fromJson(dynamic value) => TagTypeEnumTypeTransformer().decode(value);

  static List<TagTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TagTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TagTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TagTypeEnum] to String,
/// and [decode] dynamic data back to [TagTypeEnum].
class TagTypeEnumTypeTransformer {
  factory TagTypeEnumTypeTransformer() => _instance ??= const TagTypeEnumTypeTransformer._();

  const TagTypeEnumTypeTransformer._();

  String encode(TagTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a TagTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TagTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'OBJECT': return TagTypeEnum.OBJECT;
        case r'FACE': return TagTypeEnum.FACE;
        case r'CUSTOM': return TagTypeEnum.CUSTOM;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [TagTypeEnumTypeTransformer] instance.
  static TagTypeEnumTypeTransformer? _instance;
}

