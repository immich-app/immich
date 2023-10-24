//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UnassignedFacesResponseDto {
  /// Returns a new [UnassignedFacesResponseDto] instance.
  UnassignedFacesResponseDto({
    required this.assetFaceId,
    required this.boudinxBox,
  });

  String assetFaceId;

  AssetFaceBoxDto boudinxBox;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UnassignedFacesResponseDto &&
     other.assetFaceId == assetFaceId &&
     other.boudinxBox == boudinxBox;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetFaceId.hashCode) +
    (boudinxBox.hashCode);

  @override
  String toString() => 'UnassignedFacesResponseDto[assetFaceId=$assetFaceId, boudinxBox=$boudinxBox]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetFaceId'] = this.assetFaceId;
      json[r'boudinxBox'] = this.boudinxBox;
    return json;
  }

  /// Returns a new [UnassignedFacesResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UnassignedFacesResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UnassignedFacesResponseDto(
        assetFaceId: mapValueOfType<String>(json, r'assetFaceId')!,
        boudinxBox: AssetFaceBoxDto.fromJson(json[r'boudinxBox'])!,
      );
    }
    return null;
  }

  static List<UnassignedFacesResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UnassignedFacesResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UnassignedFacesResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UnassignedFacesResponseDto> mapFromJson(dynamic json) {
    final map = <String, UnassignedFacesResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UnassignedFacesResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UnassignedFacesResponseDto-objects as value to a dart map
  static Map<String, List<UnassignedFacesResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UnassignedFacesResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UnassignedFacesResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetFaceId',
    'boudinxBox',
  };
}

