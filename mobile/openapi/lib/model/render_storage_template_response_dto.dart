//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RenderStorageTemplateResponseDto {
  /// Returns a new [RenderStorageTemplateResponseDto] instance.
  RenderStorageTemplateResponseDto({
    required this.rendered,
  });

  /// Rendered storage template path
  String rendered;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RenderStorageTemplateResponseDto &&
    other.rendered == rendered;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (rendered.hashCode);

  @override
  String toString() => 'RenderStorageTemplateResponseDto[rendered=$rendered]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'rendered'] = this.rendered;
    return json;
  }

  /// Returns a new [RenderStorageTemplateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RenderStorageTemplateResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "RenderStorageTemplateResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RenderStorageTemplateResponseDto(
        rendered: mapValueOfType<String>(json, r'rendered')!,
      );
    }
    return null;
  }

  static List<RenderStorageTemplateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RenderStorageTemplateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RenderStorageTemplateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RenderStorageTemplateResponseDto> mapFromJson(dynamic json) {
    final map = <String, RenderStorageTemplateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RenderStorageTemplateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RenderStorageTemplateResponseDto-objects as value to a dart map
  static Map<String, List<RenderStorageTemplateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RenderStorageTemplateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RenderStorageTemplateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'rendered',
  };
}

