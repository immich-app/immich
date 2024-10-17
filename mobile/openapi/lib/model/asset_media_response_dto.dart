//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetMediaResponseDto {
  /// Returns a new [AssetMediaResponseDto] instance.
  AssetMediaResponseDto({
    required this.id,
    required this.status,
  });

  String id;

  AssetMediaStatus status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetMediaResponseDto &&
    other.id == id &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'AssetMediaResponseDto[id=$id, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [AssetMediaResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetMediaResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetMediaResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetMediaResponseDto(
        id: mapValueOfType<String>(json, r'id')!,
        status: AssetMediaStatus.fromJson(json[r'status'])!,
      );
    }
    return null;
  }

  static List<AssetMediaResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetMediaResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetMediaResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetMediaResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetMediaResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetMediaResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetMediaResponseDto-objects as value to a dart map
  static Map<String, List<AssetMediaResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetMediaResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetMediaResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'status',
  };
}

