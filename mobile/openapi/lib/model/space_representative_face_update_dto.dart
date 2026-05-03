//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SpaceRepresentativeFaceUpdateDto {
  /// Returns a new [SpaceRepresentativeFaceUpdateDto] instance.
  SpaceRepresentativeFaceUpdateDto({
    required this.assetFaceId,
  });

  /// Asset face ID used as the space representative face
  String? assetFaceId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SpaceRepresentativeFaceUpdateDto &&
    other.assetFaceId == assetFaceId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetFaceId == null ? 0 : assetFaceId!.hashCode);

  @override
  String toString() => 'SpaceRepresentativeFaceUpdateDto[assetFaceId=$assetFaceId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.assetFaceId != null) {
      json[r'assetFaceId'] = this.assetFaceId;
    } else {
    //  json[r'assetFaceId'] = null;
    }
    return json;
  }

  /// Returns a new [SpaceRepresentativeFaceUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SpaceRepresentativeFaceUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "SpaceRepresentativeFaceUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SpaceRepresentativeFaceUpdateDto(
        assetFaceId: mapValueOfType<String>(json, r'assetFaceId'),
      );
    }
    return null;
  }

  static List<SpaceRepresentativeFaceUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SpaceRepresentativeFaceUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SpaceRepresentativeFaceUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SpaceRepresentativeFaceUpdateDto> mapFromJson(dynamic json) {
    final map = <String, SpaceRepresentativeFaceUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SpaceRepresentativeFaceUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SpaceRepresentativeFaceUpdateDto-objects as value to a dart map
  static Map<String, List<SpaceRepresentativeFaceUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SpaceRepresentativeFaceUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SpaceRepresentativeFaceUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetFaceId',
  };
}

