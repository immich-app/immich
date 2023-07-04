//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LibraryResponseDto {
  /// Returns a new [LibraryResponseDto] instance.
  LibraryResponseDto({
    required this.type,
    required this.id,
    required this.ownerId,
    required this.name,
    required this.assetCount,
    required this.createdAt,
    required this.updatedAt,
    this.refreshedAt,
  });

  LibraryTypeEnum type;

  String id;

  String ownerId;

  String name;

  num assetCount;

  DateTime createdAt;

  DateTime updatedAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? refreshedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LibraryResponseDto &&
     other.type == type &&
     other.id == id &&
     other.ownerId == ownerId &&
     other.name == name &&
     other.assetCount == assetCount &&
     other.createdAt == createdAt &&
     other.updatedAt == updatedAt &&
     other.refreshedAt == refreshedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (type.hashCode) +
    (id.hashCode) +
    (ownerId.hashCode) +
    (name.hashCode) +
    (assetCount.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode) +
    (refreshedAt == null ? 0 : refreshedAt!.hashCode);

  @override
  String toString() => 'LibraryResponseDto[type=$type, id=$id, ownerId=$ownerId, name=$name, assetCount=$assetCount, createdAt=$createdAt, updatedAt=$updatedAt, refreshedAt=$refreshedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'type'] = this.type;
      json[r'id'] = this.id;
      json[r'ownerId'] = this.ownerId;
      json[r'name'] = this.name;
      json[r'assetCount'] = this.assetCount;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    if (this.refreshedAt != null) {
      json[r'refreshedAt'] = this.refreshedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'refreshedAt'] = null;
    }
    return json;
  }

  /// Returns a new [LibraryResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LibraryResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LibraryResponseDto(
        type: LibraryTypeEnum.fromJson(json[r'type'])!,
        id: mapValueOfType<String>(json, r'id')!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        name: mapValueOfType<String>(json, r'name')!,
        assetCount: num.parse('${json[r'assetCount']}'),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
        refreshedAt: mapDateTime(json, r'refreshedAt', r''),
      );
    }
    return null;
  }

  static List<LibraryResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LibraryResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LibraryResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LibraryResponseDto> mapFromJson(dynamic json) {
    final map = <String, LibraryResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LibraryResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LibraryResponseDto-objects as value to a dart map
  static Map<String, List<LibraryResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LibraryResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LibraryResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'type',
    'id',
    'ownerId',
    'name',
    'assetCount',
    'createdAt',
    'updatedAt',
  };
}

