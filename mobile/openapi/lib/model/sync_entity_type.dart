//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SyncEntityType {
  /// Instantiate a new enum with the provided [value].
  const SyncEntityType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const userV1 = SyncEntityType._(r'UserV1');
  static const userDeleteV1 = SyncEntityType._(r'UserDeleteV1');
  static const partnerV1 = SyncEntityType._(r'PartnerV1');
  static const partnerDeleteV1 = SyncEntityType._(r'PartnerDeleteV1');
  static const assetV1 = SyncEntityType._(r'AssetV1');
  static const assetDeleteV1 = SyncEntityType._(r'AssetDeleteV1');
  static const assetExifV1 = SyncEntityType._(r'AssetExifV1');
  static const partnerAssetV1 = SyncEntityType._(r'PartnerAssetV1');
  static const partnerAssetDeleteV1 = SyncEntityType._(r'PartnerAssetDeleteV1');
  static const partnerAssetExifV1 = SyncEntityType._(r'PartnerAssetExifV1');

  /// List of all possible values in this [enum][SyncEntityType].
  static const values = <SyncEntityType>[
    userV1,
    userDeleteV1,
    partnerV1,
    partnerDeleteV1,
    assetV1,
    assetDeleteV1,
    assetExifV1,
    partnerAssetV1,
    partnerAssetDeleteV1,
    partnerAssetExifV1,
  ];

  static SyncEntityType? fromJson(dynamic value) => SyncEntityTypeTypeTransformer().decode(value);

  static List<SyncEntityType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncEntityType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncEntityType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SyncEntityType] to String,
/// and [decode] dynamic data back to [SyncEntityType].
class SyncEntityTypeTypeTransformer {
  factory SyncEntityTypeTypeTransformer() => _instance ??= const SyncEntityTypeTypeTransformer._();

  const SyncEntityTypeTypeTransformer._();

  String encode(SyncEntityType data) => data.value;

  /// Decodes a [dynamic value][data] to a SyncEntityType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SyncEntityType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'UserV1': return SyncEntityType.userV1;
        case r'UserDeleteV1': return SyncEntityType.userDeleteV1;
        case r'PartnerV1': return SyncEntityType.partnerV1;
        case r'PartnerDeleteV1': return SyncEntityType.partnerDeleteV1;
        case r'AssetV1': return SyncEntityType.assetV1;
        case r'AssetDeleteV1': return SyncEntityType.assetDeleteV1;
        case r'AssetExifV1': return SyncEntityType.assetExifV1;
        case r'PartnerAssetV1': return SyncEntityType.partnerAssetV1;
        case r'PartnerAssetDeleteV1': return SyncEntityType.partnerAssetDeleteV1;
        case r'PartnerAssetExifV1': return SyncEntityType.partnerAssetExifV1;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SyncEntityTypeTypeTransformer] instance.
  static SyncEntityTypeTypeTransformer? _instance;
}

