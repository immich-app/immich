//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SyncRequestType {
  /// Instantiate a new enum with the provided [value].
  const SyncRequestType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const usersV1 = SyncRequestType._(r'UsersV1');
  static const partnersV1 = SyncRequestType._(r'PartnersV1');
  static const assetsV1 = SyncRequestType._(r'AssetsV1');
  static const assetExifsV1 = SyncRequestType._(r'AssetExifsV1');
  static const partnerAssetsV1 = SyncRequestType._(r'PartnerAssetsV1');
  static const partnerAssetExifsV1 = SyncRequestType._(r'PartnerAssetExifsV1');

  /// List of all possible values in this [enum][SyncRequestType].
  static const values = <SyncRequestType>[
    usersV1,
    partnersV1,
    assetsV1,
    assetExifsV1,
    partnerAssetsV1,
    partnerAssetExifsV1,
  ];

  static SyncRequestType? fromJson(dynamic value) => SyncRequestTypeTypeTransformer().decode(value);

  static List<SyncRequestType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncRequestType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncRequestType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SyncRequestType] to String,
/// and [decode] dynamic data back to [SyncRequestType].
class SyncRequestTypeTypeTransformer {
  factory SyncRequestTypeTypeTransformer() => _instance ??= const SyncRequestTypeTypeTransformer._();

  const SyncRequestTypeTypeTransformer._();

  String encode(SyncRequestType data) => data.value;

  /// Decodes a [dynamic value][data] to a SyncRequestType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SyncRequestType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'UsersV1': return SyncRequestType.usersV1;
        case r'PartnersV1': return SyncRequestType.partnersV1;
        case r'AssetsV1': return SyncRequestType.assetsV1;
        case r'AssetExifsV1': return SyncRequestType.assetExifsV1;
        case r'PartnerAssetsV1': return SyncRequestType.partnerAssetsV1;
        case r'PartnerAssetExifsV1': return SyncRequestType.partnerAssetExifsV1;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SyncRequestTypeTypeTransformer] instance.
  static SyncRequestTypeTypeTransformer? _instance;
}

