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
    required this.isVisible,
    required this.localDateTime,
    required this.ownerId,
    required this.thumbhash,
    required this.type,
  });

  String checksum;

  DateTime? deletedAt;

  DateTime? fileCreatedAt;

  DateTime? fileModifiedAt;

  String id;

  bool isFavorite;

  bool isVisible;

  DateTime? localDateTime;

  String ownerId;

  String? thumbhash;

  SyncAssetV1TypeEnum type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAssetV1 &&
    other.checksum == checksum &&
    other.deletedAt == deletedAt &&
    other.fileCreatedAt == fileCreatedAt &&
    other.fileModifiedAt == fileModifiedAt &&
    other.id == id &&
    other.isFavorite == isFavorite &&
    other.isVisible == isVisible &&
    other.localDateTime == localDateTime &&
    other.ownerId == ownerId &&
    other.thumbhash == thumbhash &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (fileCreatedAt == null ? 0 : fileCreatedAt!.hashCode) +
    (fileModifiedAt == null ? 0 : fileModifiedAt!.hashCode) +
    (id.hashCode) +
    (isFavorite.hashCode) +
    (isVisible.hashCode) +
    (localDateTime == null ? 0 : localDateTime!.hashCode) +
    (ownerId.hashCode) +
    (thumbhash == null ? 0 : thumbhash!.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'SyncAssetV1[checksum=$checksum, deletedAt=$deletedAt, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, id=$id, isFavorite=$isFavorite, isVisible=$isVisible, localDateTime=$localDateTime, ownerId=$ownerId, thumbhash=$thumbhash, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum'] = this.checksum;
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
    if (this.fileCreatedAt != null) {
      json[r'fileCreatedAt'] = this.fileCreatedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'fileCreatedAt'] = null;
    }
    if (this.fileModifiedAt != null) {
      json[r'fileModifiedAt'] = this.fileModifiedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'fileModifiedAt'] = null;
    }
      json[r'id'] = this.id;
      json[r'isFavorite'] = this.isFavorite;
      json[r'isVisible'] = this.isVisible;
    if (this.localDateTime != null) {
      json[r'localDateTime'] = this.localDateTime!.toUtc().toIso8601String();
    } else {
    //  json[r'localDateTime'] = null;
    }
      json[r'ownerId'] = this.ownerId;
    if (this.thumbhash != null) {
      json[r'thumbhash'] = this.thumbhash;
    } else {
    //  json[r'thumbhash'] = null;
    }
      json[r'type'] = this.type;
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
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', r''),
        fileModifiedAt: mapDateTime(json, r'fileModifiedAt', r''),
        id: mapValueOfType<String>(json, r'id')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isVisible: mapValueOfType<bool>(json, r'isVisible')!,
        localDateTime: mapDateTime(json, r'localDateTime', r''),
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        thumbhash: mapValueOfType<String>(json, r'thumbhash'),
        type: SyncAssetV1TypeEnum.fromJson(json[r'type'])!,
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
    'isVisible',
    'localDateTime',
    'ownerId',
    'thumbhash',
    'type',
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


