//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetType {
  /// Instantiate a new enum with the provided [value].
  const AssetType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const IMAGE = AssetType._(r'IMAGE');
  static const VIDEO = AssetType._(r'VIDEO');
  static const AUDIO = AssetType._(r'AUDIO');
  static const OTHER = AssetType._(r'OTHER');

  /// List of all possible values in this [enum][AssetType].
  static const values = <AssetType>[
    IMAGE,
    VIDEO,
    AUDIO,
    OTHER,
  ];

  static AssetType? fromJson(dynamic value) => AssetTypeTypeTransformer().decode(value);

  static List<AssetType>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetType] to String,
/// and [decode] dynamic data back to [AssetType].
class AssetTypeTypeTransformer {
  factory AssetTypeTypeTransformer() => _instance ??= const AssetTypeTypeTransformer._();

  const AssetTypeTypeTransformer._();

  String encode(AssetType data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'IMAGE': return AssetType.IMAGE;
        case r'VIDEO': return AssetType.VIDEO;
        case r'AUDIO': return AssetType.AUDIO;
        case r'OTHER': return AssetType.OTHER;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetTypeTypeTransformer] instance.
  static AssetTypeTypeTransformer? _instance;
}

