//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryPrimaryBackendReconfigureRequestDto {
  /// Returns a new [RepositoryPrimaryBackendReconfigureRequestDto] instance.
  RepositoryPrimaryBackendReconfigureRequestDto({
    required this.backendId,
  });

  String backendId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryPrimaryBackendReconfigureRequestDto &&
    other.backendId == backendId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backendId.hashCode);

  @override
  String toString() => 'RepositoryPrimaryBackendReconfigureRequestDto[backendId=$backendId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backendId'] = this.backendId;
    return json;
  }

  /// Returns a new [RepositoryPrimaryBackendReconfigureRequestDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryPrimaryBackendReconfigureRequestDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryPrimaryBackendReconfigureRequestDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryPrimaryBackendReconfigureRequestDto(
        backendId: mapValueOfType<String>(json, r'backendId')!,
      );
    }
    return null;
  }

  static List<RepositoryPrimaryBackendReconfigureRequestDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryPrimaryBackendReconfigureRequestDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryPrimaryBackendReconfigureRequestDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryPrimaryBackendReconfigureRequestDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryPrimaryBackendReconfigureRequestDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryPrimaryBackendReconfigureRequestDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryPrimaryBackendReconfigureRequestDto-objects as value to a dart map
  static Map<String, List<RepositoryPrimaryBackendReconfigureRequestDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryPrimaryBackendReconfigureRequestDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryPrimaryBackendReconfigureRequestDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'backendId',
  };
}

