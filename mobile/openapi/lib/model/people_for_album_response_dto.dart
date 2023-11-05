//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PeopleForAlbumResponseDto {
  /// Returns a new [PeopleForAlbumResponseDto] instance.
  PeopleForAlbumResponseDto({
    required this.albumCount,
    required this.personId,
    required this.personName,
  });

  int albumCount;

  String personId;

  String personName;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PeopleForAlbumResponseDto &&
     other.albumCount == albumCount &&
     other.personId == personId &&
     other.personName == personName;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumCount.hashCode) +
    (personId.hashCode) +
    (personName.hashCode);

  @override
  String toString() => 'PeopleForAlbumResponseDto[albumCount=$albumCount, personId=$personId, personName=$personName]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumCount'] = this.albumCount;
      json[r'personId'] = this.personId;
      json[r'personName'] = this.personName;
    return json;
  }

  /// Returns a new [PeopleForAlbumResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PeopleForAlbumResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PeopleForAlbumResponseDto(
        albumCount: mapValueOfType<int>(json, r'albumCount')!,
        personId: mapValueOfType<String>(json, r'personId')!,
        personName: mapValueOfType<String>(json, r'personName')!,
      );
    }
    return null;
  }

  static List<PeopleForAlbumResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PeopleForAlbumResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PeopleForAlbumResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PeopleForAlbumResponseDto> mapFromJson(dynamic json) {
    final map = <String, PeopleForAlbumResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PeopleForAlbumResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PeopleForAlbumResponseDto-objects as value to a dart map
  static Map<String, List<PeopleForAlbumResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PeopleForAlbumResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PeopleForAlbumResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumCount',
    'personId',
    'personName',
  };
}

