//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const AssetTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const IMAGE = AssetTypeEnum._(r'IMAGE');
  static const VIDEO = AssetTypeEnum._(r'VIDEO');
  static const AUDIO = AssetTypeEnum._(r'AUDIO');
  static const OTHER = AssetTypeEnum._(r'OTHER');

  /// List of all possible values in this [enum][AssetTypeEnum].
  static const values = <AssetTypeEnum>[
    IMAGE,
    VIDEO,
    AUDIO,
    OTHER,
  ];

  static AssetTypeEnum? fromJson(dynamic value) => AssetTypeEnumTypeTransformer().decode(value);

  static List<AssetTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetTypeEnum] to String,
/// and [decode] dynamic data back to [AssetTypeEnum].
class AssetTypeEnumTypeTransformer {
  factory AssetTypeEnumTypeTransformer() => _instance ??= const AssetTypeEnumTypeTransformer._();

  const AssetTypeEnumTypeTransformer._();

  String encode(AssetTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'IMAGE': return AssetTypeEnum.IMAGE;
        case r'VIDEO': return AssetTypeEnum.VIDEO;
        case r'AUDIO': return AssetTypeEnum.AUDIO;
        case r'OTHER': return AssetTypeEnum.OTHER;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetTypeEnumTypeTransformer] instance.
  static AssetTypeEnumTypeTransformer? _instance;
}

