//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAssetV1 {
  /// Returns a new [SyncAssetV1] instance.
  SyncAssetV1({
    required this.checksum,
    required this.deletedAt,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    required this.id,
    required this.isFavorite,
    required this.localDateTime,
    required this.ownerId,
    required this.thumbhash,
    required this.type,
    required this.visibility,
  });

  String checksum;

  Option<DateTime>? deletedAt;

  Option<DateTime>? fileCreatedAt;

  Option<DateTime>? fileModifiedAt;

  String id;

  bool isFavorite;

  Option<DateTime>? localDateTime;

  String ownerId;

  Option<String>? thumbhash;

  SyncAssetV1TypeEnum type;

  SyncAssetV1VisibilityEnum visibility;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAssetV1 &&
    other.checksum == checksum &&
    other.deletedAt == deletedAt &&
    other.fileCreatedAt == fileCreatedAt &&
    other.fileModifiedAt == fileModifiedAt &&
    other.id == id &&
    other.isFavorite == isFavorite &&
    other.localDateTime == localDateTime &&
    other.ownerId == ownerId &&
    other.thumbhash == thumbhash &&
    other.type == type &&
    other.visibility == visibility;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (fileCreatedAt == null ? 0 : fileCreatedAt!.hashCode) +
    (fileModifiedAt == null ? 0 : fileModifiedAt!.hashCode) +
    (id.hashCode) +
    (isFavorite.hashCode) +
    (localDateTime == null ? 0 : localDateTime!.hashCode) +
    (ownerId.hashCode) +
    (thumbhash == null ? 0 : thumbhash!.hashCode) +
    (type.hashCode) +
    (visibility.hashCode);

  @override
  String toString() => 'SyncAssetV1[checksum=$checksum, deletedAt=$deletedAt, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, id=$id, isFavorite=$isFavorite, localDateTime=$localDateTime, ownerId=$ownerId, thumbhash=$thumbhash, type=$type, visibility=$visibility]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum'] = this.checksum;
    if (this.deletedAt?.isSome ?? false) {
      json[r'deletedAt'] = this.deletedAt!.unwrap().toUtc().toIso8601String();
    } else {
      if(this.deletedAt?.isNone ?? false) {
        json[r'deletedAt'] = null;
      }
    }
    if (this.fileCreatedAt?.isSome ?? false) {
      json[r'fileCreatedAt'] = this.fileCreatedAt!.unwrap().toUtc().toIso8601String();
    } else {
      if(this.fileCreatedAt?.isNone ?? false) {
        json[r'fileCreatedAt'] = null;
      }
    }
    if (this.fileModifiedAt?.isSome ?? false) {
      json[r'fileModifiedAt'] = this.fileModifiedAt!.unwrap().toUtc().toIso8601String();
    } else {
      if(this.fileModifiedAt?.isNone ?? false) {
        json[r'fileModifiedAt'] = null;
      }
    }
      json[r'id'] = this.id;
      json[r'isFavorite'] = this.isFavorite;
    if (this.localDateTime?.isSome ?? false) {
      json[r'localDateTime'] = this.localDateTime!.unwrap().toUtc().toIso8601String();
    } else {
      if(this.localDateTime?.isNone ?? false) {
        json[r'localDateTime'] = null;
      }
    }
      json[r'ownerId'] = this.ownerId;
    if (this.thumbhash?.isSome ?? false) {
      json[r'thumbhash'] = this.thumbhash;
    } else {
      if(this.thumbhash?.isNone ?? false) {
        json[r'thumbhash'] = null;
      }
    }
      json[r'type'] = this.type;
      json[r'visibility'] = this.visibility;
    return json;
  }

  /// Returns a new [SyncAssetV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAssetV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAssetV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAssetV1(
        checksum: mapValueOfType<String>(json, r'checksum')!,
        deletedAt:  Option.from(mapDateTime(json, r'deletedAt', r'')),
        fileCreatedAt:  Option.from(mapDateTime(json, r'fileCreatedAt', r'')),
        fileModifiedAt:  Option.from(mapDateTime(json, r'fileModifiedAt', r'')),
        id: mapValueOfType<String>(json, r'id')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        localDateTime:  Option.from(mapDateTime(json, r'localDateTime', r'')),
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        thumbhash: Option.from(mapValueOfType<String>(json, r'thumbhash')),
        type: SyncAssetV1TypeEnum.fromJson(json[r'type'])!,
        visibility: SyncAssetV1VisibilityEnum.fromJson(json[r'visibility'])!,
      );
    }
    return null;
  }

  static List<SyncAssetV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAssetV1> mapFromJson(dynamic json) {
    final map = <String, SyncAssetV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAssetV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAssetV1-objects as value to a dart map
  static Map<String, List<SyncAssetV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAssetV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAssetV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'checksum',
    'deletedAt',
    'fileCreatedAt',
    'fileModifiedAt',
    'id',
    'isFavorite',
    'localDateTime',
    'ownerId',
    'thumbhash',
    'type',
    'visibility',
  };
}


class SyncAssetV1TypeEnum {
  /// Instantiate a new enum with the provided [value].
  const SyncAssetV1TypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const IMAGE = SyncAssetV1TypeEnum._(r'IMAGE');
  static const VIDEO = SyncAssetV1TypeEnum._(r'VIDEO');
  static const AUDIO = SyncAssetV1TypeEnum._(r'AUDIO');
  static const OTHER = SyncAssetV1TypeEnum._(r'OTHER');

  /// List of all possible values in this [enum][SyncAssetV1TypeEnum].
  static const values = <SyncAssetV1TypeEnum>[
    IMAGE,
    VIDEO,
    AUDIO,
    OTHER,
  ];

  static SyncAssetV1TypeEnum? fromJson(dynamic value) => SyncAssetV1TypeEnumTypeTransformer().decode(value);

  static List<SyncAssetV1TypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetV1TypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetV1TypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SyncAssetV1TypeEnum] to String,
/// and [decode] dynamic data back to [SyncAssetV1TypeEnum].
class SyncAssetV1TypeEnumTypeTransformer {
  factory SyncAssetV1TypeEnumTypeTransformer() => _instance ??= const SyncAssetV1TypeEnumTypeTransformer._();

  const SyncAssetV1TypeEnumTypeTransformer._();

  String encode(SyncAssetV1TypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SyncAssetV1TypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SyncAssetV1TypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'IMAGE': return SyncAssetV1TypeEnum.IMAGE;
        case r'VIDEO': return SyncAssetV1TypeEnum.VIDEO;
        case r'AUDIO': return SyncAssetV1TypeEnum.AUDIO;
        case r'OTHER': return SyncAssetV1TypeEnum.OTHER;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SyncAssetV1TypeEnumTypeTransformer] instance.
  static SyncAssetV1TypeEnumTypeTransformer? _instance;
}



class SyncAssetV1VisibilityEnum {
  /// Instantiate a new enum with the provided [value].
  const SyncAssetV1VisibilityEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const archive = SyncAssetV1VisibilityEnum._(r'archive');
  static const timeline = SyncAssetV1VisibilityEnum._(r'timeline');
  static const hidden = SyncAssetV1VisibilityEnum._(r'hidden');
  static const locked = SyncAssetV1VisibilityEnum._(r'locked');

  /// List of all possible values in this [enum][SyncAssetV1VisibilityEnum].
  static const values = <SyncAssetV1VisibilityEnum>[
    archive,
    timeline,
    hidden,
    locked,
  ];

  static SyncAssetV1VisibilityEnum? fromJson(dynamic value) => SyncAssetV1VisibilityEnumTypeTransformer().decode(value);

  static List<SyncAssetV1VisibilityEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetV1VisibilityEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetV1VisibilityEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SyncAssetV1VisibilityEnum] to String,
/// and [decode] dynamic data back to [SyncAssetV1VisibilityEnum].
class SyncAssetV1VisibilityEnumTypeTransformer {
  factory SyncAssetV1VisibilityEnumTypeTransformer() => _instance ??= const SyncAssetV1VisibilityEnumTypeTransformer._();

  const SyncAssetV1VisibilityEnumTypeTransformer._();

  String encode(SyncAssetV1VisibilityEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SyncAssetV1VisibilityEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SyncAssetV1VisibilityEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'archive': return SyncAssetV1VisibilityEnum.archive;
        case r'timeline': return SyncAssetV1VisibilityEnum.timeline;
        case r'hidden': return SyncAssetV1VisibilityEnum.hidden;
        case r'locked': return SyncAssetV1VisibilityEnum.locked;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SyncAssetV1VisibilityEnumTypeTransformer] instance.
  static SyncAssetV1VisibilityEnumTypeTransformer? _instance;
}


