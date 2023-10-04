//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonEntity {
  /// Returns a new [PersonEntity] instance.
  PersonEntity({
    required this.birthDate,
    required this.createdAt,
    required this.faceAsset,
    required this.faceAssetId,
    this.faces = const [],
    required this.id,
    required this.isHidden,
    required this.name,
    required this.owner,
    required this.ownerId,
    required this.thumbnailPath,
    required this.updatedAt,
  });

  DateTime? birthDate;

  DateTime createdAt;

  AssetEntity? faceAsset;

  String? faceAssetId;

  List<AssetFaceEntity> faces;

  String id;

  bool isHidden;

  String name;

  UserEntity owner;

  String ownerId;

  String thumbnailPath;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonEntity &&
     other.birthDate == birthDate &&
     other.createdAt == createdAt &&
     other.faceAsset == faceAsset &&
     other.faceAssetId == faceAssetId &&
     other.faces == faces &&
     other.id == id &&
     other.isHidden == isHidden &&
     other.name == name &&
     other.owner == owner &&
     other.ownerId == ownerId &&
     other.thumbnailPath == thumbnailPath &&
     other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (createdAt.hashCode) +
    (faceAsset == null ? 0 : faceAsset!.hashCode) +
    (faceAssetId == null ? 0 : faceAssetId!.hashCode) +
    (faces.hashCode) +
    (id.hashCode) +
    (isHidden.hashCode) +
    (name.hashCode) +
    (owner.hashCode) +
    (ownerId.hashCode) +
    (thumbnailPath.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'PersonEntity[birthDate=$birthDate, createdAt=$createdAt, faceAsset=$faceAsset, faceAssetId=$faceAssetId, faces=$faces, id=$id, isHidden=$isHidden, name=$name, owner=$owner, ownerId=$ownerId, thumbnailPath=$thumbnailPath, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.birthDate != null) {
      json[r'birthDate'] = this.birthDate!.toUtc().toIso8601String();
    } else {
    //  json[r'birthDate'] = null;
    }
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.faceAsset != null) {
      json[r'faceAsset'] = this.faceAsset;
    } else {
    //  json[r'faceAsset'] = null;
    }
    if (this.faceAssetId != null) {
      json[r'faceAssetId'] = this.faceAssetId;
    } else {
    //  json[r'faceAssetId'] = null;
    }
      json[r'faces'] = this.faces;
      json[r'id'] = this.id;
      json[r'isHidden'] = this.isHidden;
      json[r'name'] = this.name;
      json[r'owner'] = this.owner;
      json[r'ownerId'] = this.ownerId;
      json[r'thumbnailPath'] = this.thumbnailPath;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [PersonEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonEntity(
        birthDate: mapDateTime(json, r'birthDate', ''),
        createdAt: mapDateTime(json, r'createdAt', '')!,
        faceAsset: AssetEntity.fromJson(json[r'faceAsset']),
        faceAssetId: mapValueOfType<String>(json, r'faceAssetId'),
        faces: AssetFaceEntity.listFromJson(json[r'faces']),
        id: mapValueOfType<String>(json, r'id')!,
        isHidden: mapValueOfType<bool>(json, r'isHidden')!,
        name: mapValueOfType<String>(json, r'name')!,
        owner: UserEntity.fromJson(json[r'owner'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath')!,
        updatedAt: mapDateTime(json, r'updatedAt', '')!,
      );
    }
    return null;
  }

  static List<PersonEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PersonEntity> mapFromJson(dynamic json) {
    final map = <String, PersonEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PersonEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PersonEntity-objects as value to a dart map
  static Map<String, List<PersonEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PersonEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PersonEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'birthDate',
    'createdAt',
    'faceAsset',
    'faceAssetId',
    'faces',
    'id',
    'isHidden',
    'name',
    'owner',
    'ownerId',
    'thumbnailPath',
    'updatedAt',
  };
}

