//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryBackendDto {
  /// Returns a new [RepositoryBackendDto] instance.
  RepositoryBackendDto({
    required this.id,
    required this.online,
    required this.type,
  });

  String id;

  bool online;

  BackendType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryBackendDto &&
    other.id == id &&
    other.online == online &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (online.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'RepositoryBackendDto[id=$id, online=$online, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'online'] = this.online;
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [RepositoryBackendDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryBackendDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryBackendDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryBackendDto(
        id: mapValueOfType<String>(json, r'id')!,
        online: mapValueOfType<bool>(json, r'online')!,
        type: BackendType.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<RepositoryBackendDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryBackendDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryBackendDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryBackendDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryBackendDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryBackendDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryBackendDto-objects as value to a dart map
  static Map<String, List<RepositoryBackendDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryBackendDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryBackendDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'online',
    'type',
  };
}

