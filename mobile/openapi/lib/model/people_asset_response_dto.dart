//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PeopleAssetResponseDto {
  /// Returns a new [PeopleAssetResponseDto] instance.
  PeopleAssetResponseDto({
    required this.assetFaceId,
    required this.person,
  });

  String assetFaceId;

  PersonResponseDto? person;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PeopleAssetResponseDto &&
     other.assetFaceId == assetFaceId &&
     other.person == person;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetFaceId.hashCode) +
    (person == null ? 0 : person!.hashCode);

  @override
  String toString() => 'PeopleAssetResponseDto[assetFaceId=$assetFaceId, person=$person]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetFaceId'] = this.assetFaceId;
    if (this.person != null) {
      json[r'person'] = this.person;
    } else {
    //  json[r'person'] = null;
    }
    return json;
  }

  /// Returns a new [PeopleAssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PeopleAssetResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PeopleAssetResponseDto(
        assetFaceId: mapValueOfType<String>(json, r'assetFaceId')!,
        person: PersonResponseDto.fromJson(json[r'person']),
      );
    }
    return null;
  }

  static List<PeopleAssetResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PeopleAssetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PeopleAssetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PeopleAssetResponseDto> mapFromJson(dynamic json) {
    final map = <String, PeopleAssetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PeopleAssetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PeopleAssetResponseDto-objects as value to a dart map
  static Map<String, List<PeopleAssetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PeopleAssetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PeopleAssetResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetFaceId',
    'person',
  };
}

