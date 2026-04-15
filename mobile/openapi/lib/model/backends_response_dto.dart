//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class BackendsResponseDto {
  /// Returns a new [BackendsResponseDto] instance.
  BackendsResponseDto({
    this.backends = const [],
  });

  List<BackendDto> backends;

  @override
  bool operator ==(Object other) => identical(this, other) || other is BackendsResponseDto &&
    _deepEquality.equals(other.backends, backends);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backends.hashCode);

  @override
  String toString() => 'BackendsResponseDto[backends=$backends]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backends'] = this.backends;
    return json;
  }

  /// Returns a new [BackendsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static BackendsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "BackendsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return BackendsResponseDto(
        backends: BackendDto.listFromJson(json[r'backends']),
      );
    }
    return null;
  }

  static List<BackendsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BackendsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BackendsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, BackendsResponseDto> mapFromJson(dynamic json) {
    final map = <String, BackendsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = BackendsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of BackendsResponseDto-objects as value to a dart map
  static Map<String, List<BackendsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<BackendsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = BackendsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'backends',
  };
}

