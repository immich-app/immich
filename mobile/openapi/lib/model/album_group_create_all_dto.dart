//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumGroupCreateAllDto {
  /// Returns a new [AlbumGroupCreateAllDto] instance.
  AlbumGroupCreateAllDto({
    this.groups = const [],
  });

  List<AlbumGroupDto> groups;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumGroupCreateAllDto &&
    _deepEquality.equals(other.groups, groups);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (groups.hashCode);

  @override
  String toString() => 'AlbumGroupCreateAllDto[groups=$groups]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'groups'] = this.groups;
    return json;
  }

  /// Returns a new [AlbumGroupCreateAllDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumGroupCreateAllDto? fromJson(dynamic value) {
    upgradeDto(value, "AlbumGroupCreateAllDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumGroupCreateAllDto(
        groups: AlbumGroupDto.listFromJson(json[r'groups']),
      );
    }
    return null;
  }

  static List<AlbumGroupCreateAllDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumGroupCreateAllDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumGroupCreateAllDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumGroupCreateAllDto> mapFromJson(dynamic json) {
    final map = <String, AlbumGroupCreateAllDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumGroupCreateAllDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumGroupCreateAllDto-objects as value to a dart map
  static Map<String, List<AlbumGroupCreateAllDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumGroupCreateAllDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumGroupCreateAllDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'groups',
  };
}

