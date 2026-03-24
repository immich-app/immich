//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpacePersonResponseDto {
  /// Returns a new [SharedSpacePersonResponseDto] instance.
  SharedSpacePersonResponseDto({
    this.alias,
    required this.assetCount,
    this.birthDate,
    required this.createdAt,
    required this.faceCount,
    required this.id,
    required this.isHidden,
    required this.name,
    this.representativeFaceId,
    required this.spaceId,
    required this.thumbnailPath,
    this.type,
    required this.updatedAt,
  });

  /// User-specific alias for this person
  String? alias;

  /// Number of unique assets with this person
  num assetCount;

  /// Person date of birth
  DateTime? birthDate;

  /// Creation date
  String createdAt;

  /// Number of faces assigned to this person
  num faceCount;

  /// Person ID
  String id;

  /// Is hidden
  bool isHidden;

  /// Person name
  String name;

  /// Representative face ID
  String? representativeFaceId;

  /// Space ID
  String spaceId;

  /// Thumbnail path
  String thumbnailPath;

  /// Person type (person or pet)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? type;

  /// Last update date
  String updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpacePersonResponseDto &&
    other.alias == alias &&
    other.assetCount == assetCount &&
    other.birthDate == birthDate &&
    other.createdAt == createdAt &&
    other.faceCount == faceCount &&
    other.id == id &&
    other.isHidden == isHidden &&
    other.name == name &&
    other.representativeFaceId == representativeFaceId &&
    other.spaceId == spaceId &&
    other.thumbnailPath == thumbnailPath &&
    other.type == type &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (alias == null ? 0 : alias!.hashCode) +
    (assetCount.hashCode) +
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (createdAt.hashCode) +
    (faceCount.hashCode) +
    (id.hashCode) +
    (isHidden.hashCode) +
    (name.hashCode) +
    (representativeFaceId == null ? 0 : representativeFaceId!.hashCode) +
    (spaceId.hashCode) +
    (thumbnailPath.hashCode) +
    (type == null ? 0 : type!.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'SharedSpacePersonResponseDto[alias=$alias, assetCount=$assetCount, birthDate=$birthDate, createdAt=$createdAt, faceCount=$faceCount, id=$id, isHidden=$isHidden, name=$name, representativeFaceId=$representativeFaceId, spaceId=$spaceId, thumbnailPath=$thumbnailPath, type=$type, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.alias != null) {
      json[r'alias'] = this.alias;
    } else {
    //  json[r'alias'] = null;
    }
      json[r'assetCount'] = this.assetCount;
    if (this.birthDate != null) {
      json[r'birthDate'] = _dateFormatter.format(this.birthDate!.toUtc());
    } else {
    //  json[r'birthDate'] = null;
    }
      json[r'createdAt'] = this.createdAt;
      json[r'faceCount'] = this.faceCount;
      json[r'id'] = this.id;
      json[r'isHidden'] = this.isHidden;
      json[r'name'] = this.name;
    if (this.representativeFaceId != null) {
      json[r'representativeFaceId'] = this.representativeFaceId;
    } else {
    //  json[r'representativeFaceId'] = null;
    }
      json[r'spaceId'] = this.spaceId;
      json[r'thumbnailPath'] = this.thumbnailPath;
    if (this.type != null) {
      json[r'type'] = this.type;
    } else {
    //  json[r'type'] = null;
    }
      json[r'updatedAt'] = this.updatedAt;
    return json;
  }

  /// Returns a new [SharedSpacePersonResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpacePersonResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpacePersonResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpacePersonResponseDto(
        alias: mapValueOfType<String>(json, r'alias'),
        assetCount: num.parse('${json[r'assetCount']}'),
        birthDate: mapDateTime(json, r'birthDate', r''),
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        faceCount: num.parse('${json[r'faceCount']}'),
        id: mapValueOfType<String>(json, r'id')!,
        isHidden: mapValueOfType<bool>(json, r'isHidden')!,
        name: mapValueOfType<String>(json, r'name')!,
        representativeFaceId: mapValueOfType<String>(json, r'representativeFaceId'),
        spaceId: mapValueOfType<String>(json, r'spaceId')!,
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath')!,
        type: mapValueOfType<String>(json, r'type'),
        updatedAt: mapValueOfType<String>(json, r'updatedAt')!,
      );
    }
    return null;
  }

  static List<SharedSpacePersonResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpacePersonResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpacePersonResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpacePersonResponseDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpacePersonResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpacePersonResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpacePersonResponseDto-objects as value to a dart map
  static Map<String, List<SharedSpacePersonResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpacePersonResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpacePersonResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetCount',
    'createdAt',
    'faceCount',
    'id',
    'isHidden',
    'name',
    'spaceId',
    'thumbnailPath',
    'updatedAt',
  };
}

