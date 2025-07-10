//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncPersonV1 {
  /// Returns a new [SyncPersonV1] instance.
  SyncPersonV1({
    required this.birthDate,
    required this.color,
    required this.createdAt,
    required this.faceAssetId,
    required this.id,
    required this.isFavorite,
    required this.isHidden,
    required this.name,
    required this.ownerId,
    required this.thumbnailPath,
    required this.updatedAt,
  });

  DateTime? birthDate;

  String? color;

  DateTime createdAt;

  String? faceAssetId;

  String id;

  bool isFavorite;

  bool isHidden;

  String name;

  String ownerId;

  String thumbnailPath;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncPersonV1 &&
    other.birthDate == birthDate &&
    other.color == color &&
    other.createdAt == createdAt &&
    other.faceAssetId == faceAssetId &&
    other.id == id &&
    other.isFavorite == isFavorite &&
    other.isHidden == isHidden &&
    other.name == name &&
    other.ownerId == ownerId &&
    other.thumbnailPath == thumbnailPath &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (color == null ? 0 : color!.hashCode) +
    (createdAt.hashCode) +
    (faceAssetId == null ? 0 : faceAssetId!.hashCode) +
    (id.hashCode) +
    (isFavorite.hashCode) +
    (isHidden.hashCode) +
    (name.hashCode) +
    (ownerId.hashCode) +
    (thumbnailPath.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'SyncPersonV1[birthDate=$birthDate, color=$color, createdAt=$createdAt, faceAssetId=$faceAssetId, id=$id, isFavorite=$isFavorite, isHidden=$isHidden, name=$name, ownerId=$ownerId, thumbnailPath=$thumbnailPath, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.birthDate != null) {
      json[r'birthDate'] = this.birthDate!.toUtc().toIso8601String();
    } else {
    //  json[r'birthDate'] = null;
    }
    if (this.color != null) {
      json[r'color'] = this.color;
    } else {
    //  json[r'color'] = null;
    }
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.faceAssetId != null) {
      json[r'faceAssetId'] = this.faceAssetId;
    } else {
    //  json[r'faceAssetId'] = null;
    }
      json[r'id'] = this.id;
      json[r'isFavorite'] = this.isFavorite;
      json[r'isHidden'] = this.isHidden;
      json[r'name'] = this.name;
      json[r'ownerId'] = this.ownerId;
      json[r'thumbnailPath'] = this.thumbnailPath;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [SyncPersonV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncPersonV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncPersonV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncPersonV1(
        birthDate: mapDateTime(json, r'birthDate', r''),
        color: mapValueOfType<String>(json, r'color'),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        faceAssetId: mapValueOfType<String>(json, r'faceAssetId'),
        id: mapValueOfType<String>(json, r'id')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isHidden: mapValueOfType<bool>(json, r'isHidden')!,
        name: mapValueOfType<String>(json, r'name')!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath')!,
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<SyncPersonV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncPersonV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncPersonV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncPersonV1> mapFromJson(dynamic json) {
    final map = <String, SyncPersonV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncPersonV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncPersonV1-objects as value to a dart map
  static Map<String, List<SyncPersonV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncPersonV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncPersonV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'birthDate',
    'color',
    'createdAt',
    'faceAssetId',
    'id',
    'isFavorite',
    'isHidden',
    'name',
    'ownerId',
    'thumbnailPath',
    'updatedAt',
  };
}

