//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumGroupDeleteAllDto {
  /// Returns a new [AlbumGroupDeleteAllDto] instance.
  AlbumGroupDeleteAllDto({
    this.groupIds = const [],
  });

  List<String> groupIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumGroupDeleteAllDto &&
    _deepEquality.equals(other.groupIds, groupIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (groupIds.hashCode);

  @override
  String toString() => 'AlbumGroupDeleteAllDto[groupIds=$groupIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'groupIds'] = this.groupIds;
    return json;
  }

  /// Returns a new [AlbumGroupDeleteAllDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumGroupDeleteAllDto? fromJson(dynamic value) {
    upgradeDto(value, "AlbumGroupDeleteAllDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumGroupDeleteAllDto(
        groupIds: json[r'groupIds'] is Iterable
            ? (json[r'groupIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<AlbumGroupDeleteAllDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumGroupDeleteAllDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumGroupDeleteAllDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumGroupDeleteAllDto> mapFromJson(dynamic json) {
    final map = <String, AlbumGroupDeleteAllDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumGroupDeleteAllDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumGroupDeleteAllDto-objects as value to a dart map
  static Map<String, List<AlbumGroupDeleteAllDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumGroupDeleteAllDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumGroupDeleteAllDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'groupIds',
  };
}

