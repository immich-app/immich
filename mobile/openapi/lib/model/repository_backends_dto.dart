//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryBackendsDto {
  /// Returns a new [RepositoryBackendsDto] instance.
  RepositoryBackendsDto({
    required this.primary,
    this.secondary = const [],
  });

  RepositoryBackendDto primary;

  List<RepositoryBackendDto> secondary;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryBackendsDto &&
    other.primary == primary &&
    _deepEquality.equals(other.secondary, secondary);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (primary.hashCode) +
    (secondary.hashCode);

  @override
  String toString() => 'RepositoryBackendsDto[primary=$primary, secondary=$secondary]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'primary'] = this.primary;
      json[r'secondary'] = this.secondary;
    return json;
  }

  /// Returns a new [RepositoryBackendsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryBackendsDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryBackendsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryBackendsDto(
        primary: RepositoryBackendDto.fromJson(json[r'primary'])!,
        secondary: RepositoryBackendDto.listFromJson(json[r'secondary']),
      );
    }
    return null;
  }

  static List<RepositoryBackendsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryBackendsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryBackendsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryBackendsDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryBackendsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryBackendsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryBackendsDto-objects as value to a dart map
  static Map<String, List<RepositoryBackendsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryBackendsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryBackendsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'primary',
    'secondary',
  };
}

