//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncStreamDto {
  /// Returns a new [SyncStreamDto] instance.
  SyncStreamDto({
    this.types = const [],
  });

  List<SyncStreamDtoTypesEnum> types;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncStreamDto &&
    _deepEquality.equals(other.types, types);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (types.hashCode);

  @override
  String toString() => 'SyncStreamDto[types=$types]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'types'] = this.types;
    return json;
  }

  /// Returns a new [SyncStreamDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncStreamDto? fromJson(dynamic value) {
    upgradeDto(value, "SyncStreamDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncStreamDto(
        types: SyncStreamDtoTypesEnum.listFromJson(json[r'types']),
      );
    }
    return null;
  }

  static List<SyncStreamDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncStreamDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncStreamDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncStreamDto> mapFromJson(dynamic json) {
    final map = <String, SyncStreamDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncStreamDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncStreamDto-objects as value to a dart map
  static Map<String, List<SyncStreamDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncStreamDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncStreamDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'types',
  };
}


class SyncStreamDtoTypesEnum {
  /// Instantiate a new enum with the provided [value].
  const SyncStreamDtoTypesEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const asset = SyncStreamDtoTypesEnum._(r'asset');
  static const assetPeriodPartner = SyncStreamDtoTypesEnum._(r'asset.partner');
  static const assetAlbum = SyncStreamDtoTypesEnum._(r'assetAlbum');
  static const album = SyncStreamDtoTypesEnum._(r'album');
  static const albumAsset = SyncStreamDtoTypesEnum._(r'albumAsset');
  static const albumUser = SyncStreamDtoTypesEnum._(r'albumUser');
  static const activity = SyncStreamDtoTypesEnum._(r'activity');
  static const memory = SyncStreamDtoTypesEnum._(r'memory');
  static const partner = SyncStreamDtoTypesEnum._(r'partner');
  static const person = SyncStreamDtoTypesEnum._(r'person');
  static const sharedLink = SyncStreamDtoTypesEnum._(r'sharedLink');
  static const stack = SyncStreamDtoTypesEnum._(r'stack');
  static const tag = SyncStreamDtoTypesEnum._(r'tag');
  static const user = SyncStreamDtoTypesEnum._(r'user');

  /// List of all possible values in this [enum][SyncStreamDtoTypesEnum].
  static const values = <SyncStreamDtoTypesEnum>[
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

  static SyncStreamDtoTypesEnum? fromJson(dynamic value) => SyncStreamDtoTypesEnumTypeTransformer().decode(value);

  static List<SyncStreamDtoTypesEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncStreamDtoTypesEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncStreamDtoTypesEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SyncStreamDtoTypesEnum] to String,
/// and [decode] dynamic data back to [SyncStreamDtoTypesEnum].
class SyncStreamDtoTypesEnumTypeTransformer {
  factory SyncStreamDtoTypesEnumTypeTransformer() => _instance ??= const SyncStreamDtoTypesEnumTypeTransformer._();

  const SyncStreamDtoTypesEnumTypeTransformer._();

  String encode(SyncStreamDtoTypesEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SyncStreamDtoTypesEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SyncStreamDtoTypesEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'asset': return SyncStreamDtoTypesEnum.asset;
        case r'asset.partner': return SyncStreamDtoTypesEnum.assetPeriodPartner;
        case r'assetAlbum': return SyncStreamDtoTypesEnum.assetAlbum;
        case r'album': return SyncStreamDtoTypesEnum.album;
        case r'albumAsset': return SyncStreamDtoTypesEnum.albumAsset;
        case r'albumUser': return SyncStreamDtoTypesEnum.albumUser;
        case r'activity': return SyncStreamDtoTypesEnum.activity;
        case r'memory': return SyncStreamDtoTypesEnum.memory;
        case r'partner': return SyncStreamDtoTypesEnum.partner;
        case r'person': return SyncStreamDtoTypesEnum.person;
        case r'sharedLink': return SyncStreamDtoTypesEnum.sharedLink;
        case r'stack': return SyncStreamDtoTypesEnum.stack;
        case r'tag': return SyncStreamDtoTypesEnum.tag;
        case r'user': return SyncStreamDtoTypesEnum.user;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SyncStreamDtoTypesEnumTypeTransformer] instance.
  static SyncStreamDtoTypesEnumTypeTransformer? _instance;
}


