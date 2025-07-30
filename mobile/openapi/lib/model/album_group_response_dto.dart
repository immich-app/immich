//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumGroupResponseDto {
  /// Returns a new [AlbumGroupResponseDto] instance.
  AlbumGroupResponseDto({
    required this.description,
    required this.id,
    required this.metadata,
    required this.name,
  });

  String? description;

  String id;

  AlbumGroupMetadata metadata;

  String name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumGroupResponseDto &&
    other.description == description &&
    other.id == id &&
    other.metadata == metadata &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description == null ? 0 : description!.hashCode) +
    (id.hashCode) +
    (metadata.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'AlbumGroupResponseDto[description=$description, id=$id, metadata=$metadata, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
      json[r'id'] = this.id;
      json[r'metadata'] = this.metadata;
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [AlbumGroupResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumGroupResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AlbumGroupResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumGroupResponseDto(
        description: mapValueOfType<String>(json, r'description'),
        id: mapValueOfType<String>(json, r'id')!,
        metadata: AlbumGroupMetadata.fromJson(json[r'metadata'])!,
        name: mapValueOfType<String>(json, r'name')!,
      );
    }
    return null;
  }

  static List<AlbumGroupResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumGroupResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumGroupResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumGroupResponseDto> mapFromJson(dynamic json) {
    final map = <String, AlbumGroupResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumGroupResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumGroupResponseDto-objects as value to a dart map
  static Map<String, List<AlbumGroupResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumGroupResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumGroupResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'description',
    'id',
    'metadata',
    'name',
  };
}

