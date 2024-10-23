//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SyncType {
  /// Instantiate a new enum with the provided [value].
  const SyncType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const asset = SyncType._(r'asset');
  static const assetPeriodPartner = SyncType._(r'asset.partner');
  static const assetAlbum = SyncType._(r'assetAlbum');
  static const album = SyncType._(r'album');
  static const albumAsset = SyncType._(r'albumAsset');
  static const albumUser = SyncType._(r'albumUser');
  static const activity = SyncType._(r'activity');
  static const memory = SyncType._(r'memory');
  static const partner = SyncType._(r'partner');
  static const person = SyncType._(r'person');
  static const sharedLink = SyncType._(r'sharedLink');
  static const stack = SyncType._(r'stack');
  static const tag = SyncType._(r'tag');
  static const user = SyncType._(r'user');

  /// List of all possible values in this [enum][SyncType].
  static const values = <SyncType>[
    asset,
    assetPeriodPartner,
    assetAlbum,
    album,
    albumAsset,
    albumUser,
    activity,
    memory,
    partner,
    person,
    sharedLink,
    stack,
    tag,
    user,
  ];

  static SyncType? fromJson(dynamic value) => SyncTypeTypeTransformer().decode(value);

  static List<SyncType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SyncType] to String,
/// and [decode] dynamic data back to [SyncType].
class SyncTypeTypeTransformer {
  factory SyncTypeTypeTransformer() => _instance ??= const SyncTypeTypeTransformer._();

  const SyncTypeTypeTransformer._();

  String encode(SyncType data) => data.value;

  /// Decodes a [dynamic value][data] to a SyncType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SyncType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'asset': return SyncType.asset;
        case r'asset.partner': return SyncType.assetPeriodPartner;
        case r'assetAlbum': return SyncType.assetAlbum;
        case r'album': return SyncType.album;
        case r'albumAsset': return SyncType.albumAsset;
        case r'albumUser': return SyncType.albumUser;
        case r'activity': return SyncType.activity;
        case r'memory': return SyncType.memory;
        case r'partner': return SyncType.partner;
        case r'person': return SyncType.person;
        case r'sharedLink': return SyncType.sharedLink;
        case r'stack': return SyncType.stack;
        case r'tag': return SyncType.tag;
        case r'user': return SyncType.user;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SyncTypeTypeTransformer] instance.
  static SyncTypeTypeTransformer? _instance;
}

