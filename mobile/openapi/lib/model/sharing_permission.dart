//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Sharing permission schema
class SharingPermission {
  /// Instantiate a new enum with the provided [value].
  const SharingPermission._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const all = SharingPermission._(r'all');
  static const assetPeriodRead = SharingPermission._(r'asset.read');
  static const assetPeriodUpdate = SharingPermission._(r'asset.update');
  static const assetPeriodEdit = SharingPermission._(r'asset.edit');
  static const assetPeriodDelete = SharingPermission._(r'asset.delete');
  static const assetPeriodShare = SharingPermission._(r'asset.share');
  static const exifPeriodRead = SharingPermission._(r'exif.read');
  static const personPeriodRead = SharingPermission._(r'person.read');
  static const personPeriodUpdate = SharingPermission._(r'person.update');
  static const personPeriodMerge = SharingPermission._(r'person.merge');
  static const personPeriodDelete = SharingPermission._(r'person.delete');

  /// List of all possible values in this [enum][SharingPermission].
  static const values = <SharingPermission>[
    all,
    assetPeriodRead,
    assetPeriodUpdate,
    assetPeriodEdit,
    assetPeriodDelete,
    assetPeriodShare,
    exifPeriodRead,
    personPeriodRead,
    personPeriodUpdate,
    personPeriodMerge,
    personPeriodDelete,
  ];

  static SharingPermission? fromJson(dynamic value) => SharingPermissionTypeTransformer().decode(value);

  static List<SharingPermission> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharingPermission>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharingPermission.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SharingPermission] to String,
/// and [decode] dynamic data back to [SharingPermission].
class SharingPermissionTypeTransformer {
  factory SharingPermissionTypeTransformer() => _instance ??= const SharingPermissionTypeTransformer._();

  const SharingPermissionTypeTransformer._();

  String encode(SharingPermission data) => data.value;

  /// Decodes a [dynamic value][data] to a SharingPermission.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SharingPermission? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'all': return SharingPermission.all;
        case r'asset.read': return SharingPermission.assetPeriodRead;
        case r'asset.update': return SharingPermission.assetPeriodUpdate;
        case r'asset.edit': return SharingPermission.assetPeriodEdit;
        case r'asset.delete': return SharingPermission.assetPeriodDelete;
        case r'asset.share': return SharingPermission.assetPeriodShare;
        case r'exif.read': return SharingPermission.exifPeriodRead;
        case r'person.read': return SharingPermission.personPeriodRead;
        case r'person.update': return SharingPermission.personPeriodUpdate;
        case r'person.merge': return SharingPermission.personPeriodMerge;
        case r'person.delete': return SharingPermission.personPeriodDelete;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SharingPermissionTypeTransformer] instance.
  static SharingPermissionTypeTransformer? _instance;
}

